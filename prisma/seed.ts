import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPass = await bcrypt.hash("admin123", 10);
  const caixaPass = await bcrypt.hash("caixa123", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      name: "Administrador",
      password: adminPass,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { username: "caixa" },
    update: {},
    create: {
      username: "caixa",
      name: "Operador de Caixa",
      password: caixaPass,
      role: "CAIXA",
    },
  });

  const categoriesData = ["Cervejas", "Refrigerantes", "Águas", "Destilados"];
  const categories: Record<string, string> = {};
  for (const name of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories[name] = cat.id;
  }

  const products = [
    {
      barcode: "7891000100001",
      name: "Cerveja Pilsen Lata 350ml",
      categoryId: categories["Cervejas"],
      cost: 2.2,
      price: 3.99,
      stock: 120,
      minStock: 24,
    },
    {
      barcode: "7891000100002",
      name: "Cerveja Long Neck 355ml",
      categoryId: categories["Cervejas"],
      cost: 3.5,
      price: 6.5,
      stock: 60,
      minStock: 12,
    },
    {
      barcode: "7894900010015",
      name: "Refrigerante Cola 2L",
      categoryId: categories["Refrigerantes"],
      cost: 5.0,
      price: 8.99,
      stock: 40,
      minStock: 10,
    },
    {
      barcode: "7896005800010",
      name: "Água Mineral 500ml",
      categoryId: categories["Águas"],
      cost: 0.8,
      price: 2.5,
      stock: 8,
      minStock: 24,
    },
    {
      barcode: "7891050000010",
      name: "Vodka 1L",
      categoryId: categories["Destilados"],
      cost: 22.0,
      price: 39.9,
      stock: 15,
      minStock: 5,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { barcode: p.barcode },
      update: {},
      create: p,
    });
  }

  console.log("Seed concluído: usuários, categorias e produtos criados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
