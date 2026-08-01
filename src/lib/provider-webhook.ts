import { getPaymentSettings } from "@/lib/payment-settings";
import { handleTerminalCallback } from "@/lib/terminal-callback";

function validateProviderKey(
  request: Request,
  expectedKey: string | undefined,
  headerNames: string[],
): boolean {
  if (!expectedKey) return false;
  for (const name of headerNames) {
    const value =
      name === "authorization"
        ? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
        : request.headers.get(name);
    if (value && value === expectedKey) return true;
  }
  return false;
}

export function createProviderCallbackHandler(
  paymentSource: "TERMINAL" | "SUMUP" | "TON",
  auditAction: string,
  getKey: (settings: Awaited<ReturnType<typeof getPaymentSettings>>) => string,
  headers: string[],
) {
  return async function POST(request: Request) {
    const settings = await getPaymentSettings();
    return handleTerminalCallback(request, {
      paymentSource,
      auditAction,
      validateKey: (req) => validateProviderKey(req, getKey(settings), headers),
    });
  };
}
