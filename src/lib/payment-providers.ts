import type { PaymentProviderType } from "@prisma/client";
import {
  createPointOrder,
  type MpOrder,
} from "@/lib/mercadopago-point";
import {
  getPaymentSettings,
  isProviderConfigured,
  type PaymentSettingsData,
} from "@/lib/payment-settings";

export type TerminalProvider = "generic" | "mercadopago" | "sumup" | "ton";

export type SendToTerminalResult = {
  provider: TerminalProvider;
  providerOrderId?: string;
};

export async function getActiveTerminalProvider(tenantId: string): Promise<{
  type: PaymentProviderType;
  label: string;
  configured: boolean;
  terminalProvider: TerminalProvider;
}> {
  const settings = await getPaymentSettings(tenantId);
  const type = settings.activeProvider;
  const configured = isProviderConfigured(settings, type);
  const terminalProvider = type.toLowerCase() as TerminalProvider;
  const labels: Record<PaymentProviderType, string> = {
    GENERIC: "API genérica",
    MERCADOPAGO: "Mercado Pago Point",
    SUMUP: "SumUp",
    TON: "Ton (Stone)",
  };
  return {
    type,
    label: labels[type],
    configured: type === "GENERIC" ? true : configured,
    terminalProvider,
  };
}

export async function sendSaleToTerminalProvider(input: {
  tenantId: string;
  paymentRef: string;
  total: number;
  method: "DEBITO" | "CREDITO";
}): Promise<SendToTerminalResult> {
  const settings = await getPaymentSettings(input.tenantId);
  const { activeProvider } = settings;

  switch (activeProvider) {
    case "MERCADOPAGO":
      return sendMercadoPago(input, settings);
    case "SUMUP":
    case "TON":
    case "GENERIC":
      return { provider: activeProvider.toLowerCase() as TerminalProvider };
    default:
      return { provider: "generic" };
  }
}

async function sendMercadoPago(
  input: { paymentRef: string; total: number; method: "DEBITO" | "CREDITO" },
  settings: PaymentSettingsData,
): Promise<SendToTerminalResult> {
  if (!settings.mpAccessToken || !settings.mpTerminalId) {
    throw new Error(
      "Mercado Pago não configurado. Cole Access Token e Terminal ID em Pagamentos.",
    );
  }

  const order: MpOrder = await createPointOrder(
    {
      externalReference: input.paymentRef,
      amount: input.total,
      method: input.method,
      description: `NexoPDV — ${input.paymentRef}`,
    },
    {
      accessToken: settings.mpAccessToken,
      terminalId: settings.mpTerminalId,
    },
  );

  return { provider: "mercadopago", providerOrderId: order.id };
}
