"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { savePaymentSettings } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PaymentProviderType } from "@prisma/client";

type FormState = {
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

const PROVIDERS: { id: PaymentProviderType; label: string; hint: string }[] = [
  {
    id: "GENERIC",
    label: "API genérica",
    hint: "Qualquer maquininha que envie HTTP POST (callback)",
  },
  {
    id: "MERCADOPAGO",
    label: "Mercado Pago Point",
    hint: "Point Smart / Pro — order automática na maquininha",
  },
  {
    id: "SUMUP",
    label: "SumUp",
    hint: "Webhook confirma pagamento pela referência",
  },
  {
    id: "TON",
    label: "Ton (Stone)",
    hint: "Webhook confirma pagamento pela referência",
  },
];

export function PaymentSettingsForm({
  initial,
  webhookUrls,
}: {
  initial: FormState;
  webhookUrls: Record<string, string>;
}) {
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    startTransition(async () => {
      const res = await savePaymentSettings(form);
      if (res.error) toast.error(res.error);
      else toast.success("Configurações de pagamento salvas.");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Maquininha ativa</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {PROVIDERS.map((p) => (
            <label
              key={p.id}
              className={
                "cursor-pointer rounded-lg border p-4 transition-colors " +
                (form.activeProvider === p.id
                  ? "border-zinc-400 bg-white/5 ring-1 ring-zinc-400"
                  : "border-white/10 hover:border-white/15")
              }
            >
              <div className="flex items-start gap-2">
                <input
                  type="radio"
                  name="provider"
                  checked={form.activeProvider === p.id}
                  onChange={() => setField("activeProvider", p.id)}
                  className="mt-1 accent-zinc-300"
                />
                <div>
                  <p className="font-medium text-zinc-100">{p.label}</p>
                  <p className="text-xs text-zinc-400">{p.hint}</p>
                </div>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      {form.activeProvider === "MERCADOPAGO" ? (
        <Card>
          <CardHeader>
            <CardTitle>Mercado Pago — cole quando tiver a API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field
              label="Access Token"
              value={form.mpAccessToken}
              onChange={(v) => setField("mpAccessToken", v)}
              placeholder="APP_USR-..."
            />
            <Field
              label="Terminal ID"
              value={form.mpTerminalId}
              onChange={(v) => setField("mpTerminalId", v)}
              placeholder="NEWLAND_N950__SERIAL"
            />
            <Field
              label="Webhook Secret (opcional)"
              value={form.mpWebhookSecret}
              onChange={(v) => setField("mpWebhookSecret", v)}
              placeholder="Chave do painel Suas integrações"
            />
            <p className="text-xs text-zinc-400">
              Webhook: <code className="rounded bg-[var(--maf-ink)] px-1">{webhookUrls.mercadopago}</code>
            </p>
          </CardContent>
        </Card>
      ) : null}

      {form.activeProvider === "SUMUP" ? (
        <Card>
          <CardHeader>
            <CardTitle>SumUp — cole quando tiver a API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field
              label="API Key"
              value={form.sumupApiKey}
              onChange={(v) => setField("sumupApiKey", v)}
              placeholder="Sua chave SumUp"
            />
            <Field
              label="Merchant Code (opcional)"
              value={form.sumupMerchantCode}
              onChange={(v) => setField("sumupMerchantCode", v)}
            />
            <p className="text-xs text-zinc-400">
              Webhook: <code className="rounded bg-[var(--maf-ink)] px-1">{webhookUrls.sumup}</code>
            </p>
          </CardContent>
        </Card>
      ) : null}

      {form.activeProvider === "TON" ? (
        <Card>
          <CardHeader>
            <CardTitle>Ton (Stone) — cole quando tiver a API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field
              label="API Key"
              value={form.tonApiKey}
              onChange={(v) => setField("tonApiKey", v)}
              placeholder="Sua chave Ton/Stone"
            />
            <Field
              label="Merchant ID (opcional)"
              value={form.tonMerchantId}
              onChange={(v) => setField("tonMerchantId", v)}
            />
            <p className="text-xs text-zinc-400">
              Webhook: <code className="rounded bg-[var(--maf-ink)] px-1">{webhookUrls.ton}</code>
            </p>
          </CardContent>
        </Card>
      ) : null}

      {form.activeProvider === "GENERIC" ? (
        <Card>
          <CardHeader>
            <CardTitle>API genérica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field
              label="Chave da API (X-Terminal-Key)"
              value={form.terminalApiKey}
              onChange={(v) => setField("terminalApiKey", v)}
              placeholder="sua-chave-secreta"
            />
            <p className="text-xs text-zinc-400">
              Callback: <code className="rounded bg-[var(--maf-ink)] px-1">{webhookUrls.generic}</code>
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Taxas de cartão (lucro líquido)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300">
              Taxa débito (%)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.debitFeePercent}
              onChange={(e) =>
                setField("debitFeePercent", Number(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-300">
              Taxa crédito (%)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.creditFeePercent}
              onChange={(e) =>
                setField("creditFeePercent", Number(e.target.value) || 0)
              }
            />
          </div>
          <p className="text-xs text-zinc-400 sm:col-span-2">
            Usadas nos relatórios: lucro líquido = lucro bruto − taxas estimadas
            sobre vendas no débito/crédito. Dinheiro e PIX não têm taxa.
          </p>
        </CardContent>
      </Card>

      <Button type="button" size="lg" disabled={pending} onClick={submit}>
        {pending ? "Salvando..." : "Salvar configurações"}
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}
