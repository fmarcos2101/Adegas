import { headers } from "next/headers";
import { CopyBlock } from "./copy-block";
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
  const apiKey = getTerminalApiKey();
  const keyHint = hashTerminalKey(apiKey);

  const consultaUrl = `${baseUrl}${TERMINAL_CONSULTA_PATH}?ref=REF12345`;
  const callbackUrl = `${baseUrl}${TERMINAL_CALLBACK_PATH}`;

  const curlConsulta = `curl -s "${consultaUrl}" \\
  -H "X-Terminal-Key: ${apiKey}"`;

  const curlCallback = `curl -s -X POST "${callbackUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-Terminal-Key: ${apiKey}" \\
  -d '{
    "paymentRef": "REF12345",
    "amount": 49.90,
    "method": "CREDITO",
    "status": "APPROVED",
    "terminalTxId": "TX-987654"
  }'`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Integração — Máquina de Cartão</h1>
        <p className="mt-1 text-sm text-neutral-600">
          API HTTP para a automação da máquina confirmar pagamentos e liberar vendas no PDV
          automaticamente. Porta padrão: <strong>{getTerminalApiPort()}</strong> (mesma do
          servidor Next.js).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Autenticação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Envie a chave no header <code className="rounded bg-neutral-100 px-1">X-Terminal-Key</code>{" "}
            ou <code className="rounded bg-neutral-100 px-1">Authorization: Bearer …</code>.
          </p>
          <p>
            Chave configurada (hash): <code className="font-mono">{keyHint}…</code>
          </p>
          <p className="text-neutral-500">
            Defina <code>TERMINAL_API_KEY</code> no arquivo <code>.env</code> em produção.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1. Consultar venda pendente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-neutral-600">
            A máquina consulta o valor antes de cobrar, usando a referência exibida no PDV.
          </p>
          <p className="font-mono text-xs text-neutral-800">
            GET {TERMINAL_CONSULTA_PATH}?ref=&#123;paymentRef&#125;
          </p>
          <CopyBlock label="Exemplo cURL" code={curlConsulta} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Confirmar pagamento (callback)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-neutral-600">
            Quando o pagamento for aprovado na máquina, envie o callback. O PDV detecta a
            confirmação em até 2 segundos e libera a venda.
          </p>
          <p className="font-mono text-xs text-neutral-800">POST {TERMINAL_CALLBACK_PATH}</p>
          <CopyBlock label="Exemplo cURL (aprovado)" code={curlCallback} />
          <div className="rounded-md bg-neutral-50 p-3 text-xs text-neutral-700">
            <p className="font-medium">Campos do JSON</p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              <li>
                <code>paymentRef</code> — referência de 8 caracteres (ex.: exibida no PDV)
              </li>
              <li>
                <code>amount</code> — valor cobrado (deve bater com a venda pendente)
              </li>
              <li>
                <code>method</code> — <code>DEBITO</code> ou <code>CREDITO</code>
              </li>
              <li>
                <code>status</code> — <code>APPROVED</code> ou <code>DECLINED</code>
              </li>
              <li>
                <code>terminalTxId</code> — opcional, ID da transação na máquina
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo no PDV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-neutral-700">
          <ol className="list-inside list-decimal space-y-1">
            <li>Operador monta o carrinho e escolhe Débito ou Crédito.</li>
            <li>Marca &quot;Cobrar na máquina de cartão (API)&quot; e clica Enviar para máquina.</li>
            <li>O PDV exibe a referência — informe na máquina ou integre via API.</li>
            <li>A máquina chama o callback com <code>status: APPROVED</code>.</li>
            <li>O PDV libera automaticamente. Se necessário, use Liberar manualmente.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
