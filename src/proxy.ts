import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "nexopdv_session";
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
  "/assinatura",
];

const PUBLIC_PATHS = ["/login"];

type ProxySession = {
  role?: string;
  tenantId?: string | null;
  isPlatformAdmin?: boolean;
};

async function readSession(request: NextRequest): Promise<ProxySession | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as ProxySession;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSession(request);

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (session) {
      if (session.isPlatformAdmin && !session.tenantId) {
        return NextResponse.redirect(new URL("/plataforma", request.url));
      }
      return NextResponse.redirect(
        new URL(session.role === "CAIXA" ? "/pdv" : "/", request.url),
      );
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isPlatformRoute =
    pathname === "/plataforma" || pathname.startsWith("/plataforma/");

  if (isPlatformRoute) {
    if (!session.isPlatformAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Super-admin sem loja selecionada só acessa o painel da plataforma
  if (session.isPlatformAdmin && !session.tenantId) {
    return NextResponse.redirect(new URL("/plataforma", request.url));
  }

  if (!session.tenantId) {
    return NextResponse.redirect(new URL("/login", request.url));
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
