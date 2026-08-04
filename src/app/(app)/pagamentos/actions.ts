"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { PaymentProviderType } from "@prisma/client";

const settingsSchema = z.object({
  activeProvider: z.enum(["GENERIC", "MERCADOPAGO", "SUMUP", "TON"]),
  terminalApiKey: z.string().optional(),
  mpAccessToken: z.string().optional(),
  mpTerminalId: z.string().optional(),
  mpWebhookSecret: z.string().optional(),
  sumupApiKey: z.string().optional(),
  sumupMerchantCode: z.string().optional(),
  tonApiKey: z.string().optional(),
  tonMerchantId: z.string().optional(),
  debitFeePercent: z.coerce.number().min(0).max(100).optional(),
  creditFeePercent: z.coerce.number().min(0).max(100).optional(),
});

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function savePaymentSettings(
  input: z.infer<typeof settingsSchema>,
): Promise<{ success?: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { error: "Não autorizado." };

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  const existing = await prisma.paymentSettings.findUnique({ where: { id: "default" } });

  await prisma.paymentSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      activeProvider: data.activeProvider as PaymentProviderType,
      terminalApiKey: emptyToNull(data.terminalApiKey),
      mpAccessToken: emptyToNull(data.mpAccessToken),
      mpTerminalId: emptyToNull(data.mpTerminalId),
      mpWebhookSecret: emptyToNull(data.mpWebhookSecret),
      sumupApiKey: emptyToNull(data.sumupApiKey),
      sumupMerchantCode: emptyToNull(data.sumupMerchantCode),
      tonApiKey: emptyToNull(data.tonApiKey),
      tonMerchantId: emptyToNull(data.tonMerchantId),
      debitFeePercent: data.debitFeePercent ?? 1.5,
      creditFeePercent: data.creditFeePercent ?? 3.0,
    },
    update: {
      activeProvider: data.activeProvider as PaymentProviderType,
      terminalApiKey: data.terminalApiKey !== undefined ? emptyToNull(data.terminalApiKey) : undefined,
      mpAccessToken: data.mpAccessToken !== undefined ? emptyToNull(data.mpAccessToken) : undefined,
      mpTerminalId: data.mpTerminalId !== undefined ? emptyToNull(data.mpTerminalId) : undefined,
      mpWebhookSecret:
        data.mpWebhookSecret !== undefined ? emptyToNull(data.mpWebhookSecret) : undefined,
      sumupApiKey: data.sumupApiKey !== undefined ? emptyToNull(data.sumupApiKey) : undefined,
      sumupMerchantCode:
        data.sumupMerchantCode !== undefined ? emptyToNull(data.sumupMerchantCode) : undefined,
      tonApiKey: data.tonApiKey !== undefined ? emptyToNull(data.tonApiKey) : undefined,
      tonMerchantId: data.tonMerchantId !== undefined ? emptyToNull(data.tonMerchantId) : undefined,
      debitFeePercent: data.debitFeePercent,
      creditFeePercent: data.creditFeePercent,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "CONFIG_PAGAMENTOS",
      detail: `Provedor ativo: ${data.activeProvider}${existing ? ` (antes: ${existing.activeProvider})` : ""}`,
    },
  });

  revalidatePath("/pagamentos");
  revalidatePath("/pdv");
  return { success: true };
}

export async function getPaymentSettingsForForm() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;

  // Banco pode estar desatualizado (colunas novas) logo após uma atualização
  // do sistema; nesse caso usamos os valores padrão em vez de derrubar a página.
  let row: Awaited<ReturnType<typeof prisma.paymentSettings.findUnique>> = null;
  try {
    row = await prisma.paymentSettings.findUnique({ where: { id: "default" } });
  } catch {
    row = null;
  }

  return {
    activeProvider: row?.activeProvider ?? "GENERIC",
    terminalApiKey: row?.terminalApiKey ?? "",
    mpAccessToken: row?.mpAccessToken ?? "",
    mpTerminalId: row?.mpTerminalId ?? "",
    mpWebhookSecret: row?.mpWebhookSecret ?? "",
    sumupApiKey: row?.sumupApiKey ?? "",
    sumupMerchantCode: row?.sumupMerchantCode ?? "",
    tonApiKey: row?.tonApiKey ?? "",
    tonMerchantId: row?.tonMerchantId ?? "",
    debitFeePercent: row?.debitFeePercent ?? 1.5,
    creditFeePercent: row?.creditFeePercent ?? 3.0,
  };
}
