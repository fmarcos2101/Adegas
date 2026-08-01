import { createHash, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";

const PAYMENT_REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function getTerminalApiKey(fallback?: string): string {
  return fallback?.trim() || process.env.TERMINAL_API_KEY?.trim() || "adega-terminal-dev-key-change-me";
}

export function validateTerminalApiKey(request: NextRequest, apiKey?: string): boolean {
  const expected = getTerminalApiKey(apiKey);
  const headerKey =
    request.headers.get("x-terminal-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(headerKey && headerKey === expected);
}
export function getTerminalApiPort(): number {
  const port = Number(process.env.PORT ?? process.env.TERMINAL_API_PORT ?? 3000);
  return Number.isFinite(port) ? port : 3000;
}

export function getTerminalBaseUrl(request?: NextRequest): string {
  if (request) {
    const host = request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "http";
    if (host) return `${proto}://${host}`;
  }
  return `http://localhost:${getTerminalApiPort()}`;
}

export function generatePaymentRef(): string {
  const bytes = randomBytes(8);
  let ref = "";
  for (let i = 0; i < 8; i++) {
    ref += PAYMENT_REF_CHARS[bytes[i]! % PAYMENT_REF_CHARS.length];
  }
  return ref;
}

export function hashTerminalKey(key: string): string {
  return createHash("sha256").update(key).digest("hex").slice(0, 12);
}

export const TERMINAL_CALLBACK_PATH = "/api/pagamentos/terminal/callback";
export const TERMINAL_CONSULTA_PATH = "/api/pagamentos/terminal/consulta";
