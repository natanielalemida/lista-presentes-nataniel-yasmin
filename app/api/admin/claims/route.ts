import { getAdminDashboardData } from "../../../lib/adminClaims";
import { isAdminAuthenticated } from "../../../lib/adminAuth";

export const dynamic = "force-dynamic";

function response(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return response({ error: "Sessão expirada." }, 401);
  }

  try {
    return response(await getAdminDashboardData());
  } catch (error) {
    console.error("Unable to load the admin dashboard", error);
    return response(
      { error: "Não foi possível carregar as escolhas agora." },
      503,
    );
  }
}
