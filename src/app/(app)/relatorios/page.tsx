import Link from "next/link";
import { format } from "date-fns";
import { FileSpreadsheet, FileText } from "lucide-react";
import { getReport, normalizePeriodo, type Periodo } from "@/lib/reports";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, cn } from "@/lib/utils";
import { SalesTable } from "./sales-table";

const tabs: { value: Periodo; label: string }[] = [
  { value: "dia", label: "Diário" },
  { value: "semana", label: "Semanal" },
  { value: "mes", label: "Mensal" },
];

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const sp = await searchParams;
  const periodo = normalizePeriodo(sp.periodo);
  const [report, session] = await Promise.all([getReport(periodo), getSession()]);
  const canCancel = session?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Relatórios</h1>
          <p className="text-sm text-neutral-500">{report.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/relatorios/export?format=pdf&periodo=${periodo}`}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium hover:bg-neutral-100"
          >
            <FileText className="h-4 w-4" />
            PDF
          </a>
          <a
            href={`/api/relatorios/export?format=excel&periodo=${periodo}`}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium hover:bg-neutral-100"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </a>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={`/relatorios?periodo=${t.value}`}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              periodo === t.value
                ? "bg-emerald-600 text-white"
                : "text-neutral-600 hover:bg-neutral-100",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.salesCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(report.revenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CMV (custo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-700">
              {formatBRL(report.cogs)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lucro bruto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {formatBRL(report.grossProfit)}
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Margem {report.grossMarginPercent.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Taxas cartão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {formatBRL(report.cardFees)}
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Déb. {report.debitFeePercent}% · Créd. {report.creditFeePercent}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lucro líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-800">
              {formatBRL(report.netProfit)}
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Margem {report.netMarginPercent.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lucro por mercadoria</CardTitle>
        </CardHeader>
        <CardContent>
          {report.productProfits.length === 0 ? (
            <p className="text-sm text-neutral-500">Sem vendas no período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="py-2">Produto</th>
                    <th className="py-2 text-right">Qtd</th>
                    <th className="py-2 text-right">Receita</th>
                    <th className="py-2 text-right">Custo</th>
                    <th className="py-2 text-right">Lucro bruto</th>
                    <th className="py-2 text-right">Taxas</th>
                    <th className="py-2 text-right">Lucro líquido</th>
                    <th className="py-2 text-right">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {report.productProfits.map((p) => (
                    <tr key={p.name} className="border-b border-neutral-100">
                      <td className="py-2 font-medium">{p.name}</td>
                      <td className="py-2 text-right text-neutral-500">
                        {p.quantity}
                      </td>
                      <td className="py-2 text-right">{formatBRL(p.revenue)}</td>
                      <td className="py-2 text-right">{formatBRL(p.cogs)}</td>
                      <td className="py-2 text-right font-medium text-emerald-700">
                        {formatBRL(p.grossProfit)}
                      </td>
                      <td className="py-2 text-right text-amber-700">
                        {formatBRL(p.fees)}
                      </td>
                      <td className="py-2 text-right font-medium text-emerald-800">
                        {formatBRL(p.netProfit)}
                      </td>
                      <td className="py-2 text-right">
                        {p.marginPercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-neutral-500">
            Lucro bruto = venda − preço de custo. Lucro líquido = lucro bruto −
            taxas estimadas de cartão (rateadas por produto). Configure as taxas
            em Pagamentos.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Por forma de pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {report.byMethod.length === 0 ? (
              <p className="text-sm text-neutral-500">Sem dados no período.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {report.byMethod.map((m) => (
                    <tr key={m.method} className="border-b border-neutral-100">
                      <td className="py-2">{m.method}</td>
                      <td className="py-2 text-right font-medium">
                        {formatBRL(m.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos mais vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {report.topProducts.length === 0 ? (
              <p className="text-sm text-neutral-500">Sem dados no período.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {report.topProducts.map((p) => (
                    <tr key={p.name} className="border-b border-neutral-100">
                      <td className="py-2">{p.name}</td>
                      <td className="py-2 text-right text-neutral-500">
                        {p.quantity} un
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatBRL(p.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas no período</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesTable
            canCancel={canCancel}
            sales={report.sales.map((s) => ({
              ...s,
              createdAt: format(s.createdAt, "dd/MM/yyyy HH:mm"),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
