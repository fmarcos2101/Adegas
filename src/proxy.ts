import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_SECRET_BYTES } from "@/lib/session-secret";

const COOKIE_NAME = "mafpdv_session";
const secret = AUTH_SECRET_BYTES;

const ADMIN_ONLY_PREFIXES = [
  "/dashboard",
  "/produtos",
  "/categorias",
  "/relatorios",
  "/usuarios",
  "/auditoria",
  "/backup",
  "/pagamentos",
  "/assinatura",
];

/** Rotas públicas (visitante). */
const PUBLIC_PATHS = ["/", "/login", "/cadastro"];

/** Em rotas de auth, usuário logado é redirecionado ao app. */
const AUTH_ENTRY_PATHS = ["/login", "/cadastro"];

type ProxySession = {
  role?: string;
  tenantId?: string | null;
  isPlatformAdmin?: boolean;
};

function homeForSession(session: ProxySession): string {
  if (session.isPlatformAdmin && !session.tenantId) return "/plataforma";
  if (session.role === "CAIXA") return "/pdv";
  return "/dashboard";
}

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

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)),
  );

  if (isPublic) {
    const isAuthEntry = AUTH_ENTRY_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    // Landing (/) fica acessível mesmo logado; login/cadastro redirecionam
    if (session && isAuthEntry) {
      return NextResponse.redirect(new URL(homeForSession(session), request.url));
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
      return NextResponse.redirect(new URL("/dashboard", request.url));
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

  const needsAdmin = ADMIN_ONLY_PREFIXES.some(
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
