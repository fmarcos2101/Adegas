import { prisma } from "@/lib/prisma";
import type { PaymentProviderType } from "@prisma/client";

export type PaymentSettingsData = {
  activeProvider: PaymentProviderType;
  terminalApiKey: string;
  mpAccessToken: string;
  mpTerminalId: string;
  mpWebhookSecret: string;
  sumupApiKey: string;
  sumupMerchantCode: string;
  tonApiKey: string;
  tonMerchantId: string;
  debitFeePercent: number;
  creditFeePercent: number;
};

const DEFAULTS: PaymentSettingsData = {
  activeProvider: "GENERIC",
  terminalApiKey: "",
  mpAccessToken: "",
  mpTerminalId: "",
  mpWebhookSecret: "",
  sumupApiKey: "",
  sumupMerchantCode: "",
  tonApiKey: "",
  tonMerchantId: "",
  debitFeePercent: 1.5,
  creditFeePercent: 3.0,
};

export const PROVIDER_LABELS: Record<PaymentProviderType, string> = {
  GENERIC: "API genérica",
  MERCADOPAGO: "Mercado Pago Point",
  SUMUP: "SumUp",
  TON: "Ton (Stone)",
};

function fromEnv(): Partial<PaymentSettingsData> {
  return {
    terminalApiKey: process.env.TERMINAL_API_KEY?.trim() ?? "",
    mpAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ?? "",
    mpTerminalId: process.env.MERCADOPAGO_TERMINAL_ID?.trim() ?? "",
    mpWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() ?? "",
  };
}

function rowToData(row: {
  activeProvider: PaymentProviderType;
  terminalApiKey: string | null;
  mpAccessToken: string | null;
  mpTerminalId: string | null;
  mpWebhookSecret: string | null;
  sumupApiKey: string | null;
  sumupMerchantCode: string | null;
  tonApiKey: string | null;
  tonMerchantId: string | null;
  debitFeePercent: number;
  creditFeePercent: number;
} | null): PaymentSettingsData {
  const env = fromEnv();
  if (!row) {
    return {
      ...DEFAULTS,
      terminalApiKey: env.terminalApiKey || DEFAULTS.terminalApiKey,
      mpAccessToken: env.mpAccessToken || DEFAULTS.mpAccessToken,
      mpTerminalId: env.mpTerminalId || DEFAULTS.mpTerminalId,
      mpWebhookSecret: env.mpWebhookSecret || DEFAULTS.mpWebhookSecret,
    };
  }
  return {
    activeProvider: row.activeProvider,
    terminalApiKey: row.terminalApiKey ?? env.terminalApiKey ?? "",
    mpAccessToken: row.mpAccessToken ?? env.mpAccessToken ?? "",
    mpTerminalId: row.mpTerminalId ?? env.mpTerminalId ?? "",
    mpWebhookSecret: row.mpWebhookSecret ?? env.mpWebhookSecret ?? "",
    sumupApiKey: row.sumupApiKey ?? "",
    sumupMerchantCode: row.sumupMerchantCode ?? "",
    tonApiKey: row.tonApiKey ?? "",
    tonMerchantId: row.tonMerchantId ?? "",
    debitFeePercent: row.debitFeePercent ?? DEFAULTS.debitFeePercent,
    creditFeePercent: row.creditFeePercent ?? DEFAULTS.creditFeePercent,
  };
}

export async function getPaymentSettings(): Promise<PaymentSettingsData> {
  try {
    const row = await prisma.paymentSettings.findUnique({
      where: { id: "default" },
    });
    return rowToData(row);
  } catch {
    // Banco ainda não migrado / tabela ausente — evita Internal Server Error no PDV
    return rowToData(null);
  }
}

export function isProviderConfigured(
  settings: PaymentSettingsData,
  provider: PaymentProviderType,
): boolean {
  switch (provider) {
    case "MERCADOPAGO":
      return Boolean(settings.mpAccessToken && settings.mpTerminalId);
    case "SUMUP":
      return Boolean(settings.sumupApiKey);
    case "TON":
      return Boolean(settings.tonApiKey);
    case "GENERIC":
      return Boolean(settings.terminalApiKey);
    default:
      return false;
  }
}

export function maskSecret(value: string): string {
  if (!value) return "—";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
