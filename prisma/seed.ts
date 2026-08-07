import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

/**
 * Cria a conta do dono da plataforma apenas se ela ainda não existir.
 *
 * IMPORTANTE: nunca sobrescreve a senha de uma conta já existente. O seed é
 * reexecutado em produção (ex.: script de reparo) e resetar a senha para o
 * valor padrão reabriria a conta principal com credenciais públicas e
 * conhecidas. Para forçar um reset intencional em ambiente controlado, use
 * `SEED_RESET_OWNER_PASSWORD=1`.
 */
async function upsertPlatformOwner(passwordHash: string) {
  const existing = await prisma.user.findFirst({
    where: { isPlatformAdmin: true, username: "owner" },
  });
  if (existing) {
    const forceReset = process.env.SEED_RESET_OWNER_PASSWORD === "1";
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        ...(forceReset ? { password: passwordHash } : {}),
        active: true,
      },
    });
    if (forceReset) {
      console.log("  [SEED_RESET_OWNER_PASSWORD=1] Senha do owner foi redefinida.");
    }
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

  const TRIAL_DAYS = 7;
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
  trialEnd.setHours(23, 59, 59, 999);

  await prisma.subscription.upsert({
    where: { tenantId: demo.id },
    update: {
      status: "TRIALING",
      trialEndsAt: trialEnd,
      currentPeriodEnd: trialEnd,
      notes: `Teste grátis de ${TRIAL_DAYS} dias`,
    },
    create: {
      tenantId: demo.id,
      plan: "TRIAL",
      status: "TRIALING",
      priceMonthly: 0,
      trialEndsAt: trialEnd,
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEnd,
      notes: `Teste grátis de ${TRIAL_DAYS} dias`,
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

  await prisma.platformBillingSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      basicPrice: 79.9,
      proPrice: 149.9,
      mpAccessToken: process.env.PLATFORM_MP_ACCESS_TOKEN?.trim() || null,
      mpWebhookSecret: process.env.PLATFORM_MP_WEBHOOK_SECRET?.trim() || null,
    },
  });

  console.log("Seed MAF PDV concluído:");
  console.log(
    "  Plataforma → usuário owner (senha padrão owner123 apenas na primeira criação; senhas existentes não são alteradas)",
  );
  console.log("  Loja demo  → código 'demo' + admin/admin123 ou caixa/caixa123");
  console.log("  Cobrança   → configure em /plataforma/cobranca (Mercado Pago)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
