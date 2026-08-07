"use server";

import { promises as fs } from "node:fs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getDbPath } from "@/lib/dbfile";

export type RestoreState = { error?: string; success?: boolean };

/**
 * Restauração completa do banco (todas as lojas). Exclusiva do dono da
 * plataforma: um administrador de loja jamais pode substituir o banco
 * inteiro do SaaS.
 */
export async function restoreBackupPlatform(
  _prev: RestoreState,
  formData: FormData,
): Promise<RestoreState> {
  const session = await getSession();
  if (!session?.isPlatformAdmin) return { error: "Não autorizado." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo de backup (.db)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const header = buffer.subarray(0, 16).toString("utf8");
  if (!header.startsWith("SQLite format 3")) {
    return { error: "Arquivo inválido: não é um banco SQLite." };
  }

  try {
    await prisma.$disconnect();
    await fs.writeFile(getDbPath(), buffer);

    await prisma.auditLog.create({
      data: {
        tenantId: null,
        userId: session.userId,
        action: "RESTAURAR_BACKUP_PLATAFORMA",
        detail: `Backup completo do SaaS restaurado por ${session.username} (${file.name})`,
      },
    });

    revalidatePath("/plataforma");
    revalidatePath("/plataforma/backup");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Falha ao restaurar backup.",
    };
  }
}
