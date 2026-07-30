import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  adminAuthConfigured,
  createAdminSessionToken,
  validateAdminPassword,
} from "../../../lib/adminAuth";
import {
  adminLoginIsRateLimited,
  clearAdminLoginFailures,
  registerAdminLoginFailure,
} from "../../../lib/adminLoginRateLimit";
import {
  clientIp,
  isSameOriginMutation,
} from "../../../lib/requestSecurity";

export const dynamic = "force-dynamic";

function noStoreResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return noStoreResponse({ error: "Acesso não autorizado." }, 403);
  }
  if (!adminAuthConfigured()) {
    return noStoreResponse(
      { error: "O painel administrativo ainda não está configurado." },
      503,
    );
  }

  const ip = clientIp(request);
  try {
    if (await adminLoginIsRateLimited(ip)) {
      return noStoreResponse(
        { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
        429,
      );
    }
  } catch (error) {
    console.error("Unable to check the admin login limit", error);
    return noStoreResponse(
      { error: "Não foi possível validar o acesso agora." },
      503,
    );
  }

  let password: unknown;
  try {
    const body = (await request.json()) as { password?: unknown };
    password = body.password;
  } catch {
    return noStoreResponse({ error: "Senha incorreta." }, 401);
  }

  if (!validateAdminPassword(password)) {
    try {
      await registerAdminLoginFailure(ip);
    } catch (error) {
      console.error("Unable to register an admin login failure", error);
      return noStoreResponse(
        { error: "Não foi possível validar o acesso agora." },
        503,
      );
    }
    return noStoreResponse({ error: "Senha incorreta." }, 401);
  }

  try {
    await clearAdminLoginFailures(ip);
  } catch (error) {
    console.error("Unable to clear the admin login limit", error);
    return noStoreResponse(
      { error: "Não foi possível validar o acesso agora." },
      503,
    );
  }
  const response = noStoreResponse({ authenticated: true });
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return response;
}

export async function DELETE(request: Request) {
  if (!isSameOriginMutation(request)) {
    return noStoreResponse({ error: "Acesso não autorizado." }, 403);
  }

  const response = noStoreResponse({ authenticated: false });
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
