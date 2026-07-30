import { BlobPreconditionFailedError, del, put } from "@vercel/blob";
import {
  availabilityFromClaims,
  CLAIMS_PREFIX,
  giftById,
  type GiftClaim,
  listAllClaims,
  readClaim,
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
    const claims = await listAllClaims();
    return response({ availability: availabilityFromClaims(claims) });
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

  const reservationId = body.reservationId;
  const guestMessage = cleanGuestMessage(body.guestMessage);
  const prefix = `${CLAIMS_PREFIX}/${gift.id}/`;

  try {
    let giftClaims = await listAllClaims(prefix);
    const existingClaims = await Promise.all(
      giftClaims.map((blob) => readClaim(blob.url)),
    );

    const existingClaimIndex = existingClaims.findIndex(
      (claim) => claim?.reservationId === reservationId,
    );
    if (existingClaimIndex >= 0) {
      const existingClaim = existingClaims[existingClaimIndex];
      const existingBlob = giftClaims[existingClaimIndex];

      if (existingClaim && existingBlob) {
        try {
          await put(
            existingBlob.pathname,
            JSON.stringify({
              ...existingClaim,
              guestName,
              guestMessage: guestMessage || undefined,
            } satisfies GiftClaim),
            {
              access: "private",
              addRandomSuffix: false,
              allowOverwrite: true,
              contentType: "application/json",
              ifMatch: existingBlob.etag,
            },
          );
        } catch (error) {
          if (error instanceof BlobPreconditionFailedError) {
            const allClaims = await listAllClaims();
            return response(
              {
                error: "A reserva mudou. Atualize a página e tente novamente.",
                availability: availabilityFromClaims(allClaims),
              },
              409,
            );
          }
          throw error;
        }
      }

      const allClaims = await listAllClaims();
      return response({
        availability: availabilityFromClaims(allClaims),
        reserved: true,
        alreadyReserved: true,
      });
    }

    for (let slot = 1; slot <= gift.quantity.total; slot += 1) {
      const pathname = `${prefix}slot-${slot}.json`;
      if (giftClaims.some((blob) => blob.pathname === pathname)) continue;

      const claim: GiftClaim = {
        giftId: gift.id,
        reservationId,
        createdAt: new Date().toISOString(),
        guestName,
        guestMessage: guestMessage || undefined,
      };

      try {
        await put(pathname, JSON.stringify(claim), {
          access: "private",
          addRandomSuffix: false,
          contentType: "application/json",
        });

        const allClaims = await listAllClaims();
        return response({
          availability: availabilityFromClaims(allClaims),
          reserved: true,
          alreadyReserved: false,
        });
      } catch (writeError) {
        const storedClaim = await readClaim(pathname).catch(() => null);
        if (storedClaim?.reservationId === reservationId) {
          const allClaims = await listAllClaims();
          return response({
            availability: availabilityFromClaims(allClaims),
            reserved: true,
            alreadyReserved: true,
          });
        }

        if (storedClaim) {
          giftClaims = await listAllClaims(prefix);
          continue;
        }

        throw writeError;
      }
    }

    const allClaims = await listAllClaims();
    return response(
      {
        error: "Este presente acabou de ser escolhido por outra pessoa.",
        availability: availabilityFromClaims(allClaims),
      },
      409,
    );
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
    const giftClaims = await listAllClaims(`${CLAIMS_PREFIX}/${gift.id}/`);
    const claims = await Promise.all(
      giftClaims.map(async (blob) => ({ blob, claim: await readClaim(blob.url) })),
    );
    const ownedClaim = claims.find(
      ({ claim }) => claim?.reservationId === body.reservationId,
    );

    if (ownedClaim) {
      try {
        await del(ownedClaim.blob.url, { ifMatch: ownedClaim.blob.etag });
      } catch (error) {
        if (error instanceof BlobPreconditionFailedError) {
          const allClaims = await listAllClaims();
          return response(
            {
              error: "A reserva mudou. Atualize a página e tente novamente.",
              availability: availabilityFromClaims(allClaims),
            },
            409,
          );
        }
        throw error;
      }
    }

    const allClaims = await listAllClaims();
    return response({
      availability: availabilityFromClaims(allClaims),
      removed: Boolean(ownedClaim),
    });
  } catch (error) {
    console.error("Unable to remove gift reservation", error);
    return response(
      { error: "Não foi possível desfazer esta escolha agora." },
      503,
    );
  }
}
