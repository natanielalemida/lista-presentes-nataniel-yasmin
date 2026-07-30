import { BlobPreconditionFailedError, del } from "@vercel/blob";
import { getAdminDashboardData } from "../../../../../lib/adminClaims";
import { isAdminAuthenticated } from "../../../../../lib/adminAuth";
import {
  giftById,
  listAllClaims,
  readClaim,
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
  if (
    !gift ||
    !Number.isInteger(slot) ||
    slot < 1 ||
    slot > gift.quantity.total
  ) {
    return response({ error: "Reserva inválida." }, 400);
  }

  let expectedReservationId: unknown;
  try {
    const body = (await request.json()) as { reservationId?: unknown };
    expectedReservationId = body.reservationId;
  } catch {
    return response({ error: "Reserva inválida." }, 400);
  }

  if (
    typeof expectedReservationId !== "string" ||
    expectedReservationId.length < 16 ||
    expectedReservationId.length > 80
  ) {
    return response({ error: "Reserva inválida." }, 400);
  }

  const pathname = `gift-claims/${giftId}/slot-${slot}.json`;

  try {
    const blobs = await listAllClaims(pathname);
    const blob = blobs.find((item) => item.pathname === pathname);
    if (!blob) return response({ error: "Esta reserva já foi removida." }, 404);

    const currentClaim = await readClaim(blob.url);
    if (!currentClaim) {
      return response({ error: "Não foi possível validar esta reserva." }, 409);
    }
    if (currentClaim.reservationId !== expectedReservationId) {
      return response(
        { error: "A reserva mudou. Atualize o painel e tente novamente." },
        409,
      );
    }

    try {
      await del(blob.url, { ifMatch: blob.etag });
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) {
        return response(
          { error: "A reserva mudou. Atualize o painel e tente novamente." },
          409,
        );
      }
      throw error;
    }
    return response({
      removed: true,
      ...(await getAdminDashboardData()),
    });
  } catch (error) {
    console.error("Unable to remove the admin claim", error);
    return response(
      { error: "Não foi possível remover esta escolha agora." },
      503,
    );
  }
}
