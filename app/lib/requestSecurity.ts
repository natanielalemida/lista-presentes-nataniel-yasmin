import "server-only";

export function isSameOriginMutation(request: Request) {
  const origin = request.headers.get("origin");
  const forwardedHost = (
    request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  )
    ?.split(",")[0]
    .trim();
  const forwardedProtocol = (
    request.headers.get("x-forwarded-proto") ??
    new URL(request.url).protocol.slice(0, -1)
  )
    .split(",")[0]
    .trim();
  const fetchSite = request.headers.get("sec-fetch-site");

  if (!origin || !forwardedHost) return false;
  if (fetchSite && fetchSite !== "same-origin") return false;

  try {
    return new URL(origin).origin === `${forwardedProtocol}://${forwardedHost}`;
  } catch {
    return false;
  }
}

export function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
