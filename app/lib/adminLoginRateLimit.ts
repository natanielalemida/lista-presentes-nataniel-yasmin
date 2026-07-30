import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import { del, list, put } from "@vercel/blob";

const ATTEMPTS_PREFIX = "admin-login-attempts";
const LOGIN_WINDOW_MS = 15 * 60 * 1_000;
export const MAX_ADMIN_LOGIN_ATTEMPTS = 5;

function ipKey(ip: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Admin session secret is not configured");
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
}

function attemptTimestamp(pathname: string) {
  const filename = pathname.split("/").at(-1) ?? "";
  const timestamp = Number(filename.split("-")[0]);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

async function attemptsForIp(ip: string) {
  const prefix = `${ATTEMPTS_PREFIX}/${ipKey(ip)}/`;
  const result = await list({ prefix, limit: 1_000 });
  const cutoff = Date.now() - LOGIN_WINDOW_MS;
  const expired = result.blobs.filter(
    (blob) => attemptTimestamp(blob.pathname) < cutoff,
  );

  if (expired.length) {
    await del(expired.map((blob) => blob.url));
  }

  return {
    prefix,
    current: result.blobs.filter(
      (blob) => attemptTimestamp(blob.pathname) >= cutoff,
    ),
  };
}

export async function adminLoginIsRateLimited(ip: string) {
  const { current } = await attemptsForIp(ip);
  return current.length >= MAX_ADMIN_LOGIN_ATTEMPTS;
}

export async function registerAdminLoginFailure(ip: string) {
  const { prefix } = await attemptsForIp(ip);
  const pathname = `${prefix}${Date.now()}-${randomUUID()}.json`;
  await put(pathname, JSON.stringify({ createdAt: new Date().toISOString() }), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export async function clearAdminLoginFailures(ip: string) {
  const { current } = await attemptsForIp(ip);
  if (current.length) await del(current.map((blob) => blob.url));
}
