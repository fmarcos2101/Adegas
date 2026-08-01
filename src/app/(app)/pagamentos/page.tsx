import { headers } from "next/headers";
import { CopyBlock } from "./copy-block";
import {
  MERCADOPAGO_WEBHOOK_PATH,
  getMercadoPagoTerminalId,
  isMercadoPagoConfigured,
  listPointTerminals,
} from "@/lib/mercadopago-point";
import {
  TERMINAL_CALLBACK_PATH,
  TERMINAL_CONSULTA_PATH,
  getTerminalApiKey,
  getTerminalApiPort,
  hashTerminalKey,
} from "@/lib/payment-terminal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PagamentosPage() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const baseUrl = host ? `${proto}://${host}` : `http://localhost:${getTerminalApiPort()}`;
  const mpEnabled = isMercadoPagoConfigured();
  const webhookUrl = `${baseUrl}${MERCADOPAGO_WEBHOOK_PATH}`;
  const mpConfiguredTerminal = mpEnabled ? getMercadoPagoTerminalId() : null;
  let terminals: Awaited<ReturnType<typeof listPointTerminals>> = [];
  let terminalError: string | null = null;
  if (mpEnabled) {
    try {
      terminals = await listPointTerminals();
    } catch (err) {
      terminalError =
        err instanceof Error ? err.message : "Não foi possível listar terminais.";
    }
  }

  const apiKey = getTerminalApiKey();

  const curlWebhookTest = `# Simule a consulta de uma order (substitua ORDER_ID)
curl -s "https://api.mercadopago.com/v1/orders/ORDER_ID" \\
  -H "Authorization: Bearer $MERCADOPAGO_ACCESS_TOKEN"`;

  const envExample = `# Mercado Pago Point
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_TERMINAL_ID=NEWLAND_N950__SERIAL_DA_MAQUINA
MERCADOPAGO_WEBHOOK_SECRET=chave-do-painel-suas-integracoes

# API genérica (fallback sem Mercado Pago)
TERMINAL_API_KEY=sua-chave-secreta`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Pagamentos — Mercado Pago Point</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Integração com maquininha Mercado Pago Point via Orders API. Porta{" "}
          <strong>{getTerminalApiPort()}</strong> (servidor Next.js).
        </p>
      </div>

      <Card className={mpEnabled ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img
              src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.21.22/mercadopago/logo__large.png"
              alt="Mercado Pago"
              className="h-6"
            />
            Status da integração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {mpEnabled ? (
            <>
              <p className="font-medium text-emerald-800">Mercado Pago Point configurado e ativo.</p>
              <p>
                Terminal configurado:{" "}
                <code className="rounded bg-white/80 px-1">{mpConfiguredTerminal}</code>
              </p>
              <p>
                Webhook: <code className="rounded bg-white/80 px-1">{webhookUrl}</code>
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-amber-900">
                Mercado Pago ainda não configurado — o PDV usa a API genérica.
              </p>
              <p className="text-amber-900/80">
                Preencha <code>MERCADOPAGO_ACCESS_TOKEN</code> e{" "}
                <code>MERCADOPAGO_TERMINAL_ID</code> no <code>.env</code> e reinicie o servidor.
              </p>
            </>
          )}
          <CopyBlock label="Variáveis .env" code={envExample} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1. Configurar no painel Mercado Pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-neutral-700">
          <ol className="list-inside list-decimal space-y-2">
            <li>
              Acesse{" "}
              <a
                href="https://www.mercadopago.com.br/developers/panel/app"
                className="text-pink-700 underline"
                target="_blank"
                rel="noreferrer"
              >
                Suas integrações
              </a>{" "}
              e crie/selecione uma aplicação.
            </li>
            <li>
              Em <strong>Webhooks → Configurar notificações</strong>, cadastre a URL de produção:
              <code className="mt-1 block rounded bg-neutral-100 p-2 text-xs">{webhookUrl}</code>
            </li>
            <li>
              Ative o evento <strong>Order (Mercado Pago)</strong> — tópico{" "}
              <code>order</code>.
            </li>
            <li>
              Copie o <strong>Access Token</strong> (teste ou produção) e o ID do terminal Point
              (formato <code>TIPO__SERIAL</code>, ex.:{" "}
              <code>NEWLAND_N950__N950NCB801293324</code>).
            </li>
            <li>
              Configure o terminal em modo <strong>PDV</strong> no app Mercado Pago (Conta → Seu
              negócio → Point → Modo PDV).
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Fluxo automático no PDV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-neutral-700">
          <ol className="list-inside list-decimal space-y-1">
            <li>Operador marca &quot;Cobrar na Mercado Pago Point&quot; e envia a venda.</li>
            <li>O sistema cria uma <strong>order</strong> na API do Mercado Pago.</li>
            <li>A maquininha Point carrega a order automaticamente.</li>
            <li>Cliente paga na máquina.</li>
            <li>
              Mercado Pago envia webhook → PDV libera a venda (ou use Liberar manualmente).
            </li>
          </ol>
        </CardContent>
      </Card>

      {mpEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle>3. Terminais detectados na conta</CardTitle>
          </CardHeader>
          <CardContent>
            {terminalError ? (
              <p className="text-sm text-red-600">{terminalError}</p>
            ) : terminals.length === 0 ? (
              <p className="text-sm text-neutral-500">Nenhum terminal encontrado.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {terminals.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs"
                  >
                    {t.id}
                    {t.id === mpConfiguredTerminal ? (
                      <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">
                        em uso
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Webhook Mercado Pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-neutral-600">
            POST <code>{MERCADOPAGO_WEBHOOK_PATH}</code> — recebe notificações do tópico{" "}
            <code>order</code> e consulta <code>GET /v1/orders/&#123;id&#125;</code> para liberar
            vendas com status <code>processed</code>.
          </p>
          <CopyBlock label="Testar consulta de order" code={curlWebhookTest} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API genérica (fallback)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-neutral-600">
          <p>
            Se Mercado Pago não estiver configurado, use a API genérica com header{" "}
            <code>X-Terminal-Key</code> (hash:{" "}
            <code>{hashTerminalKey(apiKey)}…</code>).
          </p>
          <p className="font-mono text-xs">
            GET {TERMINAL_CONSULTA_PATH}?ref=&#123;paymentRef&#125;
            <br />
            POST {TERMINAL_CALLBACK_PATH}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
