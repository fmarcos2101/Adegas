import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { format } from "date-fns";
import { getSession } from "@/lib/auth";
import { getReport, normalizePeriodo } from "@/lib/reports";
import { formatBRL } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId || session.role !== "ADMIN") {
    return new NextResponse("Não autorizado", { status: 403 });
  }

  const url = new URL(request.url);
  const fmt = url.searchParams.get("format") === "excel" ? "excel" : "pdf";
  const periodo = normalizePeriodo(url.searchParams.get("periodo"));
  const report = await getReport(periodo, session.tenantId);
  const stamp = format(new Date(), "yyyyMMdd_HHmm");

  if (fmt === "excel") {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Resumo");
    ws.addRow([`Relatório de vendas - ${report.label}`]);
    ws.addRow([]);
    ws.addRow(["Vendas", report.salesCount]);
    ws.addRow(["Faturamento", report.revenue]);
    ws.addRow(["CMV (custo)", report.cogs]);
    ws.addRow(["Lucro bruto", report.grossProfit]);
    ws.addRow(["Taxas cartão", report.cardFees]);
    ws.addRow(["Lucro líquido", report.netProfit]);
    ws.addRow(["Margem bruta %", report.grossMarginPercent]);
    ws.addRow(["Margem líquida %", report.netMarginPercent]);

    const wp = wb.addWorksheet("Lucro por mercadoria");
    wp.addRow([
      "Produto",
      "Qtd",
      "Receita",
      "Custo",
      "Lucro bruto",
      "Taxas",
      "Lucro líquido",
      "Margem %",
    ]);
    for (const p of report.productProfits) {
      wp.addRow([
        p.name,
        p.quantity,
        p.revenue,
        p.cogs,
        p.grossProfit,
        p.fees,
        p.netProfit,
        p.marginPercent,
      ]);
    }

    const wv = wb.addWorksheet("Vendas");
    wv.addRow(["Data", "Operador", "Itens", "Total", "Status"]);
    for (const s of report.sales) {
      wv.addRow([
        format(s.createdAt, "dd/MM/yyyy HH:mm"),
        s.user,
        s.itemsCount,
        s.total,
        s.status,
      ]);
    }
    const buffer = await wb.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="relatorio_${periodo}_${stamp}.xlsx"`,
      },
    });
  }

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Relatório de Vendas e Lucro", 14, 18);
  doc.setFontSize(10);
  doc.text(`Período: ${report.label}`, 14, 26);
  doc.text(`Vendas: ${report.salesCount}`, 14, 32);
  doc.text(`Faturamento: ${formatBRL(report.revenue)}`, 14, 38);
  doc.text(`CMV: ${formatBRL(report.cogs)}`, 14, 44);
  doc.text(`Lucro bruto: ${formatBRL(report.grossProfit)}`, 14, 50);
  doc.text(`Taxas cartão: ${formatBRL(report.cardFees)}`, 14, 56);
  doc.text(`Lucro líquido: ${formatBRL(report.netProfit)}`, 14, 62);

  autoTable(doc, {
    startY: 70,
    head: [["Produto", "Qtd", "Receita", "Custo", "Bruto", "Líquido", "Margem"]],
    body: report.productProfits.map((p) => [
      p.name,
      String(p.quantity),
      formatBRL(p.revenue),
      formatBRL(p.cogs),
      formatBRL(p.grossProfit),
      formatBRL(p.netProfit),
      `${p.marginPercent.toFixed(1)}%`,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 122, 87] },
  });

  const lastY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 70;

  autoTable(doc, {
    startY: lastY + 8,
    head: [["Data", "Operador", "Itens", "Total", "Status"]],
    body: report.sales.map((s) => [
      format(s.createdAt, "dd/MM/yyyy HH:mm"),
      s.user,
      String(s.itemsCount),
      formatBRL(s.total),
      s.status,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 122, 87] },
  });

  const arrayBuffer = doc.output("arraybuffer");
  return new NextResponse(Buffer.from(arrayBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio_${periodo}_${stamp}.pdf"`,
    },
  });
}
