import "server-only";

import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;
export const ADMIN_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-ny-admin" : "ny-admin";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function adminAuthConfigured() {
  return Boolean(
    process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET,
  );
}

export function validateAdminPassword(value: unknown) {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (typeof value !== "string" || !expectedPassword) return false;

  const receivedHash = createHash("sha256").update(value).digest("hex");
  const expectedHash = createHash("sha256")
    .update(expectedPassword)
    .digest("hex");
  return safeEqual(receivedHash, expectedHash);
}

export function createAdminSessionToken() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Admin session secret is not configured");

  const payload = Buffer.from(
    JSON.stringify({
      version: 1,
      expiresAt: Date.now() + ADMIN_SESSION_MAX_AGE * 1_000,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!token || !secret) return false;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;

  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  if (!safeEqual(signature, expectedSignature)) return false;

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { version?: unknown; expiresAt?: unknown };

    return (
      data.version === 1 &&
      typeof data.expiresAt === "number" &&
      Number.isFinite(data.expiresAt) &&
      data.expiresAt > Date.now()
    );
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(
    cookieStore.get(ADMIN_COOKIE_NAME)?.value,
  );
}
