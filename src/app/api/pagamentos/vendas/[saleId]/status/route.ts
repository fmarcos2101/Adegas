import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ saleId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { saleId } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { payments: true },
  });

  if (!sale) {
    return NextResponse.json({ error: "Venda não encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    saleId: sale.id,
    status: sale.status,
    total: sale.total,
    paymentRef: sale.paymentRef,
    method: sale.payments[0]?.method ?? null,
    payments: sale.payments.map((p) => ({ method: p.method, amount: p.amount })),
    paymentSource: sale.paymentSource,
    paymentConfirmedAt: sale.paymentConfirmedAt?.toISOString() ?? null,
  });
}
