import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "distribuidora_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-me-please-32bytes-minimum-000",
);

const ADMIN_ONLY_PREFIXES = [
  "/produtos",
  "/categorias",
  "/relatorios",
  "/usuarios",
  "/auditoria",
  "/backup",
  "/pagamentos",
];

async function readSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { role?: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSession(request);

  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const needsAdmin =
    pathname === "/" ||
    ADMIN_ONLY_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
  if (needsAdmin && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/pdv", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
