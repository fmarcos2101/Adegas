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
  if (!session || session.role !== "ADMIN") {
    return new NextResponse("Não autorizado", { status: 403 });
  }

  const url = new URL(request.url);
  const fmt = url.searchParams.get("format") === "excel" ? "excel" : "pdf";
  const periodo = normalizePeriodo(url.searchParams.get("periodo"));
  const report = await getReport(periodo);
  const stamp = format(new Date(), "yyyyMMdd_HHmm");

  if (fmt === "excel") {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Relatório");
    ws.addRow([`Relatório de vendas - ${report.label}`]);
    ws.addRow([]);
    ws.addRow(["Vendas", report.salesCount]);
    ws.addRow(["Faturamento", report.revenue]);
    ws.addRow(["Lucro estimado", report.profit]);
    ws.addRow([]);
    ws.addRow(["Data", "Operador", "Itens", "Total", "Status"]);
    for (const s of report.sales) {
      ws.addRow([
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
  doc.text("Relatório de Vendas", 14, 18);
  doc.setFontSize(10);
  doc.text(`Período: ${report.label}`, 14, 26);
  doc.text(`Vendas: ${report.salesCount}`, 14, 32);
  doc.text(`Faturamento: ${formatBRL(report.revenue)}`, 14, 38);
  doc.text(`Lucro estimado: ${formatBRL(report.profit)}`, 14, 44);

  autoTable(doc, {
    startY: 52,
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
