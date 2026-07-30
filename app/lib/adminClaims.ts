import "server-only";

import { gifts } from "../gifts";
import {
  availabilityFromClaims,
  listAllClaims,
  parseClaimPathname,
  readClaim,
} from "./giftClaims";

export async function getAdminDashboardData() {
  const blobs = await listAllClaims();
  const availability = availabilityFromClaims(blobs);

  const claims = (
    await Promise.all(
      blobs.map(async (blob) => {
        const parsed = parseClaimPathname(blob.pathname);
        if (!parsed) return null;

        const claim = await readClaim(blob.url);
        if (!claim || claim.giftId !== parsed.giftId) return null;

        return {
          id: `${parsed.giftId}:${parsed.slot}`,
          giftId: parsed.giftId,
          slot: parsed.slot,
          reservationId: claim.reservationId,
          guestName: claim.guestName || "Convidado não informado",
          guestMessage: claim.guestMessage || "",
          createdAt: claim.createdAt,
          giftName: parsed.gift.name,
          giftImage: parsed.gift.image,
          suggestedColor: parsed.gift.suggestedColor,
          category: parsed.gift.category,
        };
      }),
    )
  )
    .filter((claim) => claim !== null)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );

  const totalUnits = gifts.reduce(
    (sum, gift) => sum + gift.quantity.total,
    0,
  );
  const reservedUnits = Object.values(availability).reduce(
    (sum, item) => sum + item.reserved,
    0,
  );
  const completeGifts = Object.values(availability).filter(
    (item) => item.available === 0,
  ).length;

  return {
    claims,
    availability,
    summary: {
      totalUnits,
      reservedUnits,
      availableUnits: totalUnits - reservedUnits,
      completeGifts,
      progressPercent:
        totalUnits === 0 ? 0 : Math.round((reservedUnits / totalUnits) * 100),
    },
  };
}

export type AdminDashboardData = Awaited<
  ReturnType<typeof getAdminDashboardData>
>;
