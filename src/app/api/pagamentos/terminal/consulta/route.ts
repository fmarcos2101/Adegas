import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentSettings } from "@/lib/payment-settings";
import { validateTerminalApiKey } from "@/lib/payment-terminal";

export async function GET(request: Request) {
  const settings = await getPaymentSettings();
  if (!validateTerminalApiKey(request as unknown as import("next/server").NextRequest, settings.terminalApiKey)) {
    return NextResponse.json({ error: "Chave de API inválida." }, { status: 401 });
  }

  const ref = new URL(request.url).searchParams.get("ref")?.trim().toUpperCase();
  if (!ref) {
    return NextResponse.json({ error: "Informe o parâmetro ref." }, { status: 400 });
  }

  const sale = await prisma.sale.findUnique({
    where: { paymentRef: ref },
    include: { payments: true },
  });

  if (!sale) {
    return NextResponse.json({ error: "Venda não encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    saleId: sale.id,
    paymentRef: sale.paymentRef,
    status: sale.status,
    total: sale.total,
    discount: sale.discount,
    method: sale.payments[0]?.method ?? null,
    createdAt: sale.createdAt.toISOString(),
  });
}
