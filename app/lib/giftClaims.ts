import "server-only";

import { gifts } from "../gifts";
import { database, ensureDatabaseSchema } from "./database";

export const giftById = new Map(gifts.map((gift) => [gift.id, gift]));

export type GiftClaim = {
  giftId: string;
  slot: number;
  reservationId: string;
  createdAt: string;
  guestName: string;
  guestMessage: string;
};

type ClaimRow = {
  gift_id: string;
  slot: number;
  reservation_id: string;
  created_at: Date | string;
  guest_name: string;
  guest_message: string;
};

function toClaim(row: ClaimRow): GiftClaim {
  return {
    giftId: row.gift_id,
    slot: row.slot,
    reservationId: row.reservation_id,
    createdAt: new Date(row.created_at).toISOString(),
    guestName: row.guest_name,
    guestMessage: row.guest_message,
  };
}

export async function listAllClaims(giftId?: string) {
  await ensureDatabaseSchema();
  const sql = database();
  const rows = giftId
    ? await sql`SELECT * FROM gift_claims WHERE gift_id = ${giftId} ORDER BY slot`
    : await sql`SELECT * FROM gift_claims ORDER BY created_at DESC`;
  return (rows as ClaimRow[]).map(toClaim);
}

export async function saveGiftClaim(
  giftId: string,
  total: number,
  reservationId: string,
  guestName: string,
  guestMessage: string,
) {
  await ensureDatabaseSchema();
  const sql = database();

  const existing = await sql`
    UPDATE gift_claims
    SET guest_name = ${guestName}, guest_message = ${guestMessage}
    WHERE gift_id = ${giftId} AND reservation_id = ${reservationId}
    RETURNING *
  `;
  if (existing.length) return { claim: toClaim(existing[0] as ClaimRow), existed: true };

  const inserted = await sql`
    INSERT INTO gift_claims (
      gift_id, slot, reservation_id, guest_name, guest_message
    )
    SELECT ${giftId}, candidate.slot, ${reservationId}, ${guestName}, ${guestMessage}
    FROM generate_series(1, ${total}) AS candidate(slot)
    WHERE NOT EXISTS (
      SELECT 1 FROM gift_claims
      WHERE gift_id = ${giftId} AND slot = candidate.slot
    )
    ORDER BY candidate.slot
    LIMIT 1
    ON CONFLICT DO NOTHING
    RETURNING *
  `;
  return inserted.length
    ? { claim: toClaim(inserted[0] as ClaimRow), existed: false }
    : null;
}

export async function removeGiftClaim(giftId: string, reservationId: string) {
  await ensureDatabaseSchema();
  const sql = database();
  const rows = await sql`
    DELETE FROM gift_claims
    WHERE gift_id = ${giftId} AND reservation_id = ${reservationId}
    RETURNING *
  `;
  return rows.length > 0;
}

export async function removeAdminGiftClaim(
  giftId: string,
  slot: number,
  reservationId: string,
) {
  await ensureDatabaseSchema();
  const sql = database();
  const rows = await sql`
    DELETE FROM gift_claims
    WHERE gift_id = ${giftId} AND slot = ${slot}
      AND reservation_id = ${reservationId}
    RETURNING *
  `;
  return rows.length > 0;
}

export function availabilityFromClaims(claims: GiftClaim[]) {
  const reservedByGift = new Map<string, number>();
  for (const claim of claims) {
    reservedByGift.set(
      claim.giftId,
      (reservedByGift.get(claim.giftId) ?? 0) + 1,
    );
  }

  return Object.fromEntries(
    gifts.map((gift) => {
      const reserved = Math.min(
        gift.quantity.total,
        reservedByGift.get(gift.id) ?? 0,
      );
      return [
        gift.id,
        {
          total: gift.quantity.total,
          reserved,
          available: gift.quantity.total - reserved,
        },
      ];
    }),
  );
}
