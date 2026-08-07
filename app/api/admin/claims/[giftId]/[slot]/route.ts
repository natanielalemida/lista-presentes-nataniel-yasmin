import { getAdminDashboardData } from "../../../../../lib/adminClaims";
import { isAdminAuthenticated } from "../../../../../lib/adminAuth";
import {
  giftById,
  removeAdminGiftClaim,
} from "../../../../../lib/giftClaims";
import { isSameOriginMutation } from "../../../../../lib/requestSecurity";

export const dynamic = "force-dynamic";

function response(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ giftId: string; slot: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return response({ error: "Sessão expirada." }, 401);
  }
  if (!isSameOriginMutation(request)) {
    return response({ error: "Acesso não autorizado." }, 403);
  }

  const { giftId, slot: rawSlot } = await context.params;
  const gift = giftById.get(giftId);
  const slot = Number(rawSlot);
  if (!gift || !Number.isInteger(slot) || slot < 1 || slot > gift.quantity.total) {
    return response({ error: "Reserva inválida." }, 400);
  }

  let reservationId: unknown;
  try {
    reservationId = ((await request.json()) as { reservationId?: unknown }).reservationId;
  } catch {
    return response({ error: "Reserva inválida." }, 400);
  }
  if (typeof reservationId !== "string" || reservationId.length < 16 || reservationId.length > 80) {
    return response({ error: "Reserva inválida." }, 400);
  }

  try {
    const removed = await removeAdminGiftClaim(giftId, slot, reservationId);
    if (!removed) {
      return response(
        { error: "A reserva mudou ou já foi removida. Atualize o painel." },
        409,
      );
    }
    return response({ removed: true, ...(await getAdminDashboardData()) });
  } catch (error) {
    console.error("Unable to remove the admin claim", error);
    return response(
      { error: "Não foi possível remover esta escolha agora." },
      503,
    );
  }
}
