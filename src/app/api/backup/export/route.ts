import { promises as fs } from "node:fs";
import { NextResponse } from "next/server";
import { format } from "date-fns";
import { getSession } from "@/lib/auth";
import { getDbPath } from "@/lib/dbfile";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return new NextResponse("Não autorizado", { status: 403 });
  }

  const dbPath = getDbPath();
  try {
    const data = await fs.readFile(dbPath);
    const stamp = format(new Date(), "yyyyMMdd_HHmm");
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="backup_${stamp}.db"`,
      },
    });
  } catch {
    return new NextResponse("Banco de dados não encontrado.", { status: 404 });
  }
}
