import "server-only";

import { get, list, type ListBlobResultBlob } from "@vercel/blob";
import { gifts } from "../gifts";

export const CLAIMS_PREFIX = "gift-claims";
export const giftById = new Map(gifts.map((gift) => [gift.id, gift]));

export type GiftClaim = {
  giftId: string;
  reservationId: string;
  createdAt: string;
  guestName?: string;
  guestMessage?: string;
};

export async function listAllClaims(prefix = `${CLAIMS_PREFIX}/`) {
  const blobs: ListBlobResultBlob[] = [];
  let cursor: string | undefined;

  do {
    const result = await list({ prefix, cursor, limit: 1_000 });
    blobs.push(...result.blobs);
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return blobs;
}

export async function readClaim(
  pathnameOrUrl: string,
): Promise<GiftClaim | null> {
  const result = await get(pathnameOrUrl, {
    access: "private",
    useCache: false,
  });
  if (!result?.stream) return null;

  try {
    const claim = JSON.parse(
      await new Response(result.stream).text(),
    ) as Partial<GiftClaim>;

    if (
      typeof claim.giftId !== "string" ||
      typeof claim.reservationId !== "string" ||
      typeof claim.createdAt !== "string"
    ) {
      return null;
    }

    return {
      giftId: claim.giftId,
      reservationId: claim.reservationId,
      createdAt: claim.createdAt,
      guestName:
        typeof claim.guestName === "string" ? claim.guestName : undefined,
      guestMessage:
        typeof claim.guestMessage === "string" ? claim.guestMessage : undefined,
    };
  } catch {
    return null;
  }
}

export function availabilityFromClaims(blobs: ListBlobResultBlob[]) {
  const reservedByGift = new Map<string, number>();

  for (const blob of blobs) {
    const parsed = parseClaimPathname(blob.pathname);
    if (!parsed) continue;
    reservedByGift.set(
      parsed.giftId,
      (reservedByGift.get(parsed.giftId) ?? 0) + 1,
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

export function parseClaimPathname(pathname: string) {
  const match = pathname.match(
    /^gift-claims\/([a-z0-9-]+)\/slot-(\d+)\.json$/,
  );
  if (!match) return null;

  const giftId = match[1];
  const slot = Number(match[2]);
  const gift = giftById.get(giftId);
  if (!gift || !Number.isInteger(slot) || slot < 1 || slot > gift.quantity.total) {
    return null;
  }

  return { giftId, slot, gift };
}
