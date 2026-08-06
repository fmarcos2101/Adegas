import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function upsertPlatformOwner(passwordHash: string) {
  const existing = await prisma.user.findFirst({
    where: { isPlatformAdmin: true, username: "owner" },
  });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: passwordHash,
        name: "Dono da Plataforma",
        role: "ADMIN",
        active: true,
        tenantId: null,
        isPlatformAdmin: true,
      },
    });
    return;
  }
  await prisma.user.create({
    data: {
      username: "owner",
      name: "Dono da Plataforma",
      password: passwordHash,
      role: "ADMIN",
      isPlatformAdmin: true,
      tenantId: null,
    },
  });
}

async function main() {
  const ownerPass = await bcrypt.hash("owner123", 10);
  const adminPass = await bcrypt.hash("admin123", 10);
  const caixaPass = await bcrypt.hash("caixa123", 10);

  await upsertPlatformOwner(ownerPass);

  const demo = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: { name: "Loja Demonstração", active: true },
    create: {
      name: "Loja Demonstração",
      slug: "demo",
      active: true,
      notes: "Tenant de exemplo criado pelo seed",
    },
  });

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);

  await prisma.subscription.upsert({
    where: { tenantId: demo.id },
    update: {},
    create: {
      tenantId: demo.id,
      plan: "TRIAL",
      status: "TRIALING",
      priceMonthly: 0,
      trialEndsAt: trialEnd,
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEnd,
    },
  });

  await prisma.user.upsert({
    where: { tenantId_username: { tenantId: demo.id, username: "admin" } },
    update: {},
    create: {
      tenantId: demo.id,
      username: "admin",
      name: "Administrador da Loja",
      password: adminPass,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { tenantId_username: { tenantId: demo.id, username: "caixa" } },
    update: {},
    create: {
      tenantId: demo.id,
      username: "caixa",
      name: "Operador de Caixa",
      password: caixaPass,
      role: "CAIXA",
    },
  });

  await prisma.paymentSettings.upsert({
    where: { tenantId: demo.id },
    update: {},
    create: {
      tenantId: demo.id,
      activeProvider: "GENERIC",
    },
  });

  console.log("Seed NexoPDV concluído:");
  console.log(
    "  Plataforma → usuário owner / senha owner123 (deixe o código da loja em branco)",
  );
  console.log("  Loja demo  → código 'demo' + admin/admin123 ou caixa/caixa123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
