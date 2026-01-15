import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/profile",
  "/report",
  "/flag",
  "/rate",
  "/follow-wallet",
  "/admin",
  "/dashboard",
];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Skip Next internals/static.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap")
  ) {
    return NextResponse.next();
  }

  if (!isProtected(pathname)) return NextResponse.next();

  const token = req.cookies.get("token")?.value;
  if (token) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = `?redirectTo=${encodeURIComponent(pathname + (search || ""))}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/:path*"],
};
