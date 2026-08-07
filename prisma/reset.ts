import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.payment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.auditLog.deleteMany();

  // Mantém owner da plataforma e usuários admin/caixa da loja demo
  const demo = await prisma.tenant.findUnique({ where: { slug: "demo" } });
  if (demo) {
    await prisma.user.deleteMany({
      where: {
        tenantId: demo.id,
        username: { notIn: ["admin", "caixa"] },
      },
    });
  }

  console.log(
    "Banco zerado: vendas, produtos, categorias e auditoria removidos (tenants/usuários base mantidos).",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
