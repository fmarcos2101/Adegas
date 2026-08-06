// Prefixo usado para produtos cadastrados sem código de barras.
export const INTERNAL_BARCODE_PREFIX = "SEM-";

export function isInternalBarcode(barcode: string): boolean {
  return barcode.startsWith(INTERNAL_BARCODE_PREFIX);
}

/** Identidade do produto SaaS (genérica — sem marca de loja). */
export const APP_NAME = "NexoPDV";
export const APP_TAGLINE = "PDV e gestão para o seu negócio";
export const APP_DESCRIPTION =
  "Sistema multi-loja de ponto de venda, estoque e assinaturas";

/** Slug reservado — não pode ser usado por clientes. */
export const PLATFORM_SLUG = "plataforma";

export const SUBSCRIPTION_PLAN_LABEL: Record<string, string> = {
  TRIAL: "Trial",
  BASIC: "Básico",
  PRO: "Pro",
};

export const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  TRIALING: "Em trial",
  ACTIVE: "Ativa",
  PAST_DUE: "Pagamento atrasado",
  SUSPENDED: "Suspensa",
  CANCELLED: "Cancelada",
};
