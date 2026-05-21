import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "insightstack_token";

const hasAuthCookie = (req: NextRequest): boolean => {
  return Boolean(req.cookies.get(AUTH_COOKIE_NAME)?.value);
};

export function proxy(req: NextRequest): NextResponse {
  const authHeader = req.headers.get("authorization");
  const [scheme, token] = authHeader?.split(" ") ?? [];

  // Browser document navigations cannot attach Authorization headers.
  // Let client-side auth guard handle those cases.
  if (req.headers.get("sec-fetch-dest") === "document") {
    return NextResponse.next();
  }

  if ((scheme !== "Bearer" || !token) && !hasAuthCookie(req)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
