import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  });
  const client = new PrismaClient({ adapter });

  // SQLite não impõe chaves estrangeiras por padrão (é preciso ligar por
  // conexão). Sem isso, exclusões podem deixar registros órfãos (ex.: uma
  // movimentação de estoque apontando para um produto já excluído), o que
  // quebra páginas que assumem a relação sempre presente.
  client.$executeRawUnsafe("PRAGMA foreign_keys = ON;").catch(() => {});

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
