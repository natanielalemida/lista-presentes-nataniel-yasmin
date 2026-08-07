import "server-only";

import { gifts } from "../gifts";
import { availabilityFromClaims, giftById, listAllClaims } from "./giftClaims";

export async function getAdminDashboardData() {
  const storedClaims = await listAllClaims();
  const availability = availabilityFromClaims(storedClaims);
  const claims = storedClaims
    .map((claim) => {
      const gift = giftById.get(claim.giftId);
      if (!gift) return null;
      return {
        id: `${claim.giftId}:${claim.slot}`,
        giftId: claim.giftId,
        slot: claim.slot,
        reservationId: claim.reservationId,
        guestName: claim.guestName || "Convidado não informado",
        guestMessage: claim.guestMessage || "",
        createdAt: claim.createdAt,
        giftName: gift.name,
        giftImage: gift.image,
        suggestedColor: gift.suggestedColor,
        category: gift.category,
      };
    })
    .filter((claim) => claim !== null)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );

  const totalUnits = gifts.reduce((sum, gift) => sum + gift.quantity.total, 0);
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

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;
