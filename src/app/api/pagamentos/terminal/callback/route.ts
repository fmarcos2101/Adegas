import { handleTerminalCallback } from "@/lib/terminal-callback";
import { validateTerminalApiKey } from "@/lib/payment-terminal";

export async function POST(request: Request) {
  return handleTerminalCallback(request, {
    paymentSource: "TERMINAL",
    auditAction: "VENDA_LIBERADA_TERMINAL",
    validateKey: (req, settings) =>
      validateTerminalApiKey(
        req as unknown as import("next/server").NextRequest,
        settings.terminalApiKey,
      ),
  });
}
