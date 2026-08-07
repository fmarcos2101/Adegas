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

/** Dias de teste grátis para novas lojas (sem dependência de Prisma — seguro no client). */
export const TRIAL_DAYS = 7;

export const SUBSCRIPTION_PLAN_LABEL: Record<string, string> = {
  TRIAL: "Trial (7 dias · 1 PDV)",
  BASIC: "Básico (1 PDV)",
  PLUS: "Plus (até 3 PDVs)",
  PRO: "Pro (até 3 PDVs)",
};

export const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  TRIALING: "Em trial",
  ACTIVE: "Ativa",
  PAST_DUE: "Pagamento atrasado",
  SUSPENDED: "Suspensa",
  CANCELLED: "Cancelada",
};
