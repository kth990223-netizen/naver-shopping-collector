import type { Keyword } from "../types/keyword";
import { downloadWorkbook } from "./excelExport";

export async function exportKeywordsToExcel(keywords: Keyword[]): Promise<void> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("키워드 목록");

  sheet.columns = [
    { header: "키워드", key: "keyword", width: 30 },
    { header: "상태", key: "enabled", width: 10 },
    { header: "등록일", key: "created", width: 22 },
  ];

  sheet.getRow(1).font = { bold: true };

  for (const k of keywords) {
    sheet.addRow({
      keyword: k.keyword,
      enabled: k.enabled ? "사용중" : "미사용",
      created: new Date(k.created_at).toLocaleString(),
    });
  }

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columns.length } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const today = new Date().toISOString().slice(0, 10);
  await downloadWorkbook(workbook, `키워드목록_${today}.xlsx`);
}
