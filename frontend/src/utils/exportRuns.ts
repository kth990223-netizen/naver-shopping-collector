import type { RunSummary } from "./runSummary";
import { downloadWorkbook } from "./excelExport";

export async function exportRunSummariesToExcel(runs: RunSummary[]): Promise<void> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("수집 결과");

  sheet.columns = [
    { header: "시작 시각", key: "start", width: 22 },
    { header: "종료 시각", key: "end", width: 22 },
    { header: "키워드", key: "keyword", width: 20 },
    { header: "수집 건수", key: "count", width: 12 },
  ];

  sheet.getRow(1).font = { bold: true };

  for (const run of runs) {
    for (const k of run.keywords) {
      sheet.addRow({
        start: new Date(run.startedAt).toLocaleString(),
        end: new Date(run.endedAt).toLocaleString(),
        keyword: k.keyword,
        count: k.count,
      });
    }
  }

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columns.length } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const today = new Date().toISOString().slice(0, 10);
  await downloadWorkbook(workbook, `수집결과_${today}.xlsx`);
}
