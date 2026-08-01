import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const MP_API = "https://api.mercadopago.com";

export type MpPaymentType = "credit_card" | "debit_card";

export type MpOrderStatus =
  | "created"
  | "processed"
  | "failed"
  | "canceled"
  | "expired"
  | string;

export type MpOrder = {
  id: string;
  external_reference?: string;
  status: MpOrderStatus;
  status_detail?: string;
  transactions?: {
    payments?: Array<{
      id?: string;
      amount?: string;
      status?: string;
    }>;
  };
  config?: {
    payment_method?: {
      default_type?: string;
    };
  };
};

export type MpTerminal = {
  id: string;
  operating_mode?: string;
  status?: string;
};

export function isMercadoPagoConfigured(): boolean {
  return Boolean(
    process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() &&
      process.env.MERCADOPAGO_TERMINAL_ID?.trim(),
  );
}

export function getMercadoPagoAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  return token;
}

export function getMercadoPagoTerminalId(): string {
  const terminalId = process.env.MERCADOPAGO_TERMINAL_ID?.trim();
  if (!terminalId) throw new Error("MERCADOPAGO_TERMINAL_ID não configurado.");
  return terminalId;
}

export function mapMethodToMpType(method: "DEBITO" | "CREDITO"): MpPaymentType {
  return method === "DEBITO" ? "debit_card" : "credit_card";
}

export function mapMpTypeToMethod(type?: string): "DEBITO" | "CREDITO" | undefined {
  if (type === "debit_card") return "DEBITO";
  if (type === "credit_card") return "CREDITO";
  return undefined;
}

export function formatAmountForMp(amount: number): string {
  return amount.toFixed(2);
}

async function mpFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${MP_API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => ({}))) as T & {
    message?: string;
    error?: string;
    cause?: Array<{ description?: string }>;
  };

  if (!res.ok) {
    const detail =
      body.message ??
      body.error ??
      body.cause?.[0]?.description ??
      `Erro Mercado Pago (${res.status})`;
    throw new Error(detail);
  }

  return body;
}

export async function createPointOrder(input: {
  externalReference: string;
  amount: number;
  method: "DEBITO" | "CREDITO";
  description?: string;
}): Promise<MpOrder> {
  const payload = {
    type: "point",
    external_reference: input.externalReference,
    expiration_time: "PT16M",
    description: input.description ?? `Venda ${input.externalReference}`,
    transactions: {
      payments: [{ amount: formatAmountForMp(input.amount) }],
    },
    config: {
      point: {
        terminal_id: getMercadoPagoTerminalId(),
        print_on_terminal: "no_ticket",
      },
      payment_method: {
        default_type: mapMethodToMpType(input.method),
      },
    },
  };

  return mpFetch<MpOrder>("/v1/orders", {
    method: "POST",
    headers: {
      "X-Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify(payload),
  });
}

export async function getPointOrder(orderId: string): Promise<MpOrder> {
  return mpFetch<MpOrder>(`/v1/orders/${orderId}`);
}

export async function listPointTerminals(): Promise<MpTerminal[]> {
  const data = await mpFetch<{ data?: { terminals?: MpTerminal[] } }>(
    "/terminals/v1/list?limit=50&offset=0",
  );
  return data.data?.terminals ?? [];
}

export function isMercadoPagoOrderApproved(status: MpOrderStatus): boolean {
  return status === "processed";
}

export function isMercadoPagoOrderFailed(status: MpOrderStatus): boolean {
  return status === "failed" || status === "canceled" || status === "expired";
}

export function validateMercadoPagoWebhookSignature(
  signatureHeader: string | null,
  requestId: string | null,
  dataId: string | null,
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  if (!signatureHeader || !requestId || !dataId) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.trim().split("=");
      return [key, value];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
  } catch {
    return false;
  }
}

export const MERCADOPAGO_WEBHOOK_PATH = "/api/pagamentos/mercadopago/webhook";
