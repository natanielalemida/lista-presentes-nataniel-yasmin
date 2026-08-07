import "server-only";

import { neon } from "@neondatabase/serverless";

let schemaReady: Promise<void> | null = null;

export function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export function ensureDatabaseSchema() {
  if (!schemaReady) {
    const sql = database();
    schemaReady = Promise.all([
      sql`
        CREATE TABLE IF NOT EXISTS gift_claims (
          gift_id TEXT NOT NULL,
          slot INTEGER NOT NULL,
          reservation_id TEXT NOT NULL,
          guest_name TEXT NOT NULL,
          guest_message TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (gift_id, slot),
          UNIQUE (gift_id, reservation_id)
        )
      `,
      sql`
        CREATE TABLE IF NOT EXISTS admin_login_attempts (
          ip_key TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `,
      sql`
        CREATE INDEX IF NOT EXISTS admin_login_attempts_lookup
        ON admin_login_attempts (ip_key, created_at)
      `,
    ]).then(() => undefined);
  }
  return schemaReady;
}
