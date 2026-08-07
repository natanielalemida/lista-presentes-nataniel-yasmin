import {
  availabilityFromClaims,
  giftById,
  listAllClaims,
  removeGiftClaim,
  saveGiftClaim,
} from "../../lib/giftClaims";
import { isSameOriginMutation } from "../../lib/requestSecurity";

export const dynamic = "force-dynamic";

function response(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function validReservationId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 16 &&
    value.length <= 80 &&
    /^[a-zA-Z0-9_-]+$/.test(value)
  );
}

function cleanGuestName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 2 && name.length <= 80 ? name : null;
}

function cleanGuestMessage(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 500);
}

export async function GET() {
  try {
    return response({ availability: availabilityFromClaims(await listAllClaims()) });
  } catch (error) {
    console.error("Unable to read gift availability", error);
    return response(
      { error: "Não foi possível consultar a disponibilidade agora." },
      503,
    );
  }
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return response({ error: "Origem da confirmação não autorizada." }, 403);
  }

  let body: {
    giftId?: unknown;
    reservationId?: unknown;
    guestName?: unknown;
    guestMessage?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return response({ error: "Dados inválidos." }, 400);
  }

  const gift = typeof body.giftId === "string" ? giftById.get(body.giftId) : null;
  const guestName = cleanGuestName(body.guestName);
  if (!gift || !validReservationId(body.reservationId) || !guestName) {
    return response({ error: "Presente ou confirmação inválida." }, 400);
  }

  try {
    const saved = await saveGiftClaim(
      gift.id,
      gift.quantity.total,
      body.reservationId,
      guestName,
      cleanGuestMessage(body.guestMessage),
    );
    const availability = availabilityFromClaims(await listAllClaims());
    if (!saved) {
      return response(
        {
          error: "Este presente acabou de ser escolhido por outra pessoa.",
          availability,
        },
        409,
      );
    }
    return response({
      availability,
      reserved: true,
      alreadyReserved: saved.existed,
    });
  } catch (error) {
    console.error("Unable to reserve gift", error);
    return response(
      { error: "Não foi possível confirmar este presente agora." },
      503,
    );
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginMutation(request)) {
    return response({ error: "Origem da confirmação não autorizada." }, 403);
  }

  let body: { giftId?: unknown; reservationId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return response({ error: "Dados inválidos." }, 400);
  }

  const gift = typeof body.giftId === "string" ? giftById.get(body.giftId) : null;
  if (!gift || !validReservationId(body.reservationId)) {
    return response({ error: "Presente ou confirmação inválida." }, 400);
  }

  try {
    const removed = await removeGiftClaim(gift.id, body.reservationId);
    return response({
      availability: availabilityFromClaims(await listAllClaims()),
      removed,
    });
  } catch (error) {
    console.error("Unable to remove gift reservation", error);
    return response(
      { error: "Não foi possível desfazer esta escolha agora." },
      503,
    );
  }
}
