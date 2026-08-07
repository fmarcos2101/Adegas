import { NextResponse } from "next/server";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireActiveTenantAdmin, SessionGuardError } from "@/lib/session-guard";

/**
 * Exportação de backup isolada por loja: cada administrador só pode baixar
 * os dados da própria loja (nunca o banco inteiro do SaaS). Segredos de
 * pagamento e hashes de senha nunca são incluídos.
 */
export async function GET() {
  let tenantId: string;
  try {
    tenantId = (await requireActiveTenantAdmin()).tenantId;
  } catch (err) {
    const message = err instanceof SessionGuardError ? err.message : "Não autorizado.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const [tenant, users, categories, products, stockMovements, sales, auditLogs] =
    await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          active: true,
          createdAt: true,
        },
      }),
      prisma.category.findMany({ where: { tenantId } }),
      prisma.product.findMany({ where: { tenantId } }),
      prisma.stockMovement.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 5000,
      }),
      prisma.sale.findMany({
        where: { tenantId },
        include: { items: true, payments: true },
        orderBy: { createdAt: "desc" },
        take: 5000,
      }),
      prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 5000,
      }),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    scope: "tenant",
    tenant: tenant ? { id: tenant.id, name: tenant.name, slug: tenant.slug } : null,
    users,
    categories,
    products,
    stockMovements,
    sales,
    auditLogs,
  };

  const stamp = format(new Date(), "yyyyMMdd_HHmm");
  return NextResponse.json(payload, {
    headers: {
      "Content-Disposition": `attachment; filename="backup_loja_${stamp}.json"`,
    },
  });
}
