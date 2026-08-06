"use server";

import { promises as fs } from "node:fs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getDbPath } from "@/lib/dbfile";

export type RestoreState = { error?: string; success?: boolean };

export async function restoreBackup(
  _prev: RestoreState,
  formData: FormData,
): Promise<RestoreState> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { error: "Não autorizado." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo de backup (.db)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validação simples do cabeçalho de um arquivo SQLite.
  const header = buffer.subarray(0, 16).toString("utf8");
  if (!header.startsWith("SQLite format 3")) {
    return { error: "Arquivo inválido: não é um banco SQLite." };
  }

  try {
    // Fecha a conexão para liberar o arquivo antes de sobrescrever.
    await prisma.$disconnect();
    await fs.writeFile(getDbPath(), buffer);

    // A próxima consulta reabre a conexão a partir do novo arquivo.
    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        action: "RESTAURAR_BACKUP",
        detail: `Backup restaurado (${file.name})`,
      },
    });

    revalidatePath("/");
    revalidatePath("/backup");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Falha ao restaurar backup.",
    };
  }
}
