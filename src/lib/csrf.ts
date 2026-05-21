import { env } from "@/lib/env";
import { errorResponseWithRequestId } from "@/lib/http";

const AUTH_COOKIE_NAME = "insightstack_token";

const normalizeOrigin = (value: string): string | null => {
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
};

const getLoopbackEquivalentOrigin = (origin: string): string | null => {
  try {
    const url = new URL(origin);
    if (url.hostname === "localhost") {
      url.hostname = "127.0.0.1";
      return url.origin.toLowerCase();
    }
    if (url.hostname === "127.0.0.1") {
      url.hostname = "localhost";
      return url.origin.toLowerCase();
    }
    return null;
  } catch {
    return null;
  }
};

const getCookieValueFromHeader = (cookieHeader: string, name: string): string | null => {
  const items = cookieHeader.split(";");
  for (const item of items) {
    const [rawName, ...rawValueParts] = item.trim().split("=");
    if (rawName !== name) continue;
    const rawValue = rawValueParts.join("=");
    if (!rawValue) return null;
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }
  return null;
};

const hasAuthCookie = (req: Request): boolean => {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return false;
  return Boolean(getCookieValueFromHeader(cookieHeader, AUTH_COOKIE_NAME));
};

export const isBearerAuth = (req: Request): boolean => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;
  const [scheme, token] = authHeader.split(" ");
  return scheme?.toLowerCase() === "bearer" && Boolean(token);
};

const getAllowedOrigins = (req: Request): Set<string> => {
  const allowed = new Set<string>();
  const appOrigin = normalizeOrigin(env.NEXT_PUBLIC_APP_URL);
  if (appOrigin) {
    allowed.add(appOrigin);
    const loopback = getLoopbackEquivalentOrigin(appOrigin);
    if (loopback) {
      allowed.add(loopback);
    }
  }

  const requestOrigin = normalizeOrigin(req.url);
  if (requestOrigin) {
    allowed.add(requestOrigin);
    const loopback = getLoopbackEquivalentOrigin(requestOrigin);
    if (loopback) {
      allowed.add(loopback);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const localOrigins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3005",
      "http://127.0.0.1:3005",
    ];
    for (const origin of localOrigins) {
      allowed.add(origin);
    }
  }

  return allowed;
};

const isSameOrigin = (req: Request): boolean => {
  const allowedOrigins = getAllowedOrigins(req);
  const originHeader = req.headers.get("origin");
  const refererHeader = req.headers.get("referer");

  if (originHeader) {
    const origin = normalizeOrigin(originHeader);
    if (origin) {
      return allowedOrigins.has(origin);
    }
  }

  if (refererHeader) {
    const referer = normalizeOrigin(refererHeader);
    if (referer) {
      return allowedOrigins.has(referer);
    }
  }

  return true;
};

export const enforceCsrfIfCookieAuth = (
  req: Request,
  requestId: string,
) => {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return null;
  }

  if (isBearerAuth(req)) {
    return null;
  }

  if (!hasAuthCookie(req)) {
    return null;
  }

  if (!isSameOrigin(req)) {
    return errorResponseWithRequestId(requestId, 403, "FORBIDDEN", "CSRF validation failed");
  }

  return null;
};
