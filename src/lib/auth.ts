import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "mafpdv_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-me-please-32bytes-minimum-000",
);

export type Role = "ADMIN" | "CAIXA";

export interface SessionPayload {
  userId: string;
  username: string;
  name: string;
  role: Role;
  /** null quando é super-admin na plataforma (sem loja selecionada) */
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  isPlatformAdmin: boolean;
  /** true quando o dono da plataforma entrou numa loja para suporte */
  supportMode: boolean;
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

function fromJwtPayload(payload: Record<string, unknown>): SessionPayload {
  return {
    userId: payload.userId as string,
    username: payload.username as string,
    name: payload.name as string,
    role: payload.role as Role,
    tenantId: (payload.tenantId as string | null) ?? null,
    tenantSlug: (payload.tenantSlug as string | null) ?? null,
    tenantName: (payload.tenantName as string | null) ?? null,
    isPlatformAdmin: Boolean(payload.isPlatformAdmin),
    supportMode: Boolean(payload.supportMode),
  };
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return fromJwtPayload(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return fromJwtPayload(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
