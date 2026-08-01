import { NextResponse } from "next/server";
import { createProviderCallbackHandler } from "@/lib/provider-webhook";

export const POST = createProviderCallbackHandler(
  "TON",
  "VENDA_LIBERADA_TON",
  (s) => s.tonApiKey,
  ["x-ton-key", "authorization"],
);

export async function GET() {
  return NextResponse.json({
    provider: "ton",
    status: "ready",
    webhook: "/api/pagamentos/ton/webhook",
  });
}
