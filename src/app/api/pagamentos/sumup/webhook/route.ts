import { NextResponse } from "next/server";
import { createProviderCallbackHandler } from "@/lib/provider-webhook";

export const POST = createProviderCallbackHandler(
  "SUMUP",
  "VENDA_LIBERADA_SUMUP",
  (s) => s.sumupApiKey,
  ["x-sumup-key", "authorization"],
);

export async function GET() {
  return NextResponse.json({
    provider: "sumup",
    status: "ready",
    webhook: "/api/pagamentos/sumup/webhook",
  });
}
