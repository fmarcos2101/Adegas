"use server";

import { redirect } from "next/navigation";
import { destroySession, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        action: "LOGOUT",
        detail: `Logout de ${session.username}`,
      },
    });
  }
  await destroySession();
  redirect("/login");
}
