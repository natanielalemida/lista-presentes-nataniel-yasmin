import "server-only";

import { createHmac } from "node:crypto";
import { database, ensureDatabaseSchema } from "./database";

const LOGIN_WINDOW_MS = 15 * 60 * 1_000;
export const MAX_ADMIN_LOGIN_ATTEMPTS = 5;

function ipKey(ip: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Admin session secret is not configured");
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
}

async function cleanExpiredAttempts() {
  await ensureDatabaseSchema();
  const sql = database();
  const cutoff = new Date(Date.now() - LOGIN_WINDOW_MS).toISOString();
  await sql`DELETE FROM admin_login_attempts WHERE created_at < ${cutoff}`;
}

export async function adminLoginIsRateLimited(ip: string) {
  await cleanExpiredAttempts();
  const sql = database();
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM admin_login_attempts
    WHERE ip_key = ${ipKey(ip)}
  `;
  return Number(rows[0]?.count ?? 0) >= MAX_ADMIN_LOGIN_ATTEMPTS;
}

export async function registerAdminLoginFailure(ip: string) {
  await cleanExpiredAttempts();
  const sql = database();
  await sql`INSERT INTO admin_login_attempts (ip_key) VALUES (${ipKey(ip)})`;
}

export async function clearAdminLoginFailures(ip: string) {
  await ensureDatabaseSchema();
  const sql = database();
  await sql`DELETE FROM admin_login_attempts WHERE ip_key = ${ipKey(ip)}`;
}
