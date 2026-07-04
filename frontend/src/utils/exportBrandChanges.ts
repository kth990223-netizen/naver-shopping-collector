import ExcelJS from "exceljs";
import type { RunTransition } from "../services/brandChangeService";

function diffLabel(diffCount: number | null): string {
  if (diffCount === null) return "-";
  if (diffCount === 0) return "변동 없음";
  return diffCount > 0 ? `+${diffCount}` : `${diffCount}`;
}

function addKeywordSheet(
  workbook: ExcelJS.Workbook,
  keyword: string,
  transitions: RunTransition[],
): void {
  const withChange = transitions.filter((t) => t.fromRunAt !== null);

  const sheetName = `${keyword} 브랜드 변동`.replace(/[:\\/?*[\]]/g, "").slice(0, 31);
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = [
    { header: "이전 수집", key: "from", width: 20 },
    { header: "최근 수집", key: "to", width: 20 },
    { header: "브랜드 수", key: "count", width: 10 },
    { header: "증감", key: "diff", width: 10 },
    { header: "구분", key: "type", width: 10 },
    { header: "브랜드명", key: "brand", width: 30 },
  ];

  sheet.getRow(1).font = { bold: true };

  for (const t of withChange) {
    const from = new Date(t.fromRunAt!).toLocaleString();
    const to = new Date(t.toRunAt).toLocaleString();
    const diff = diffLabel(t.diffCount);

    if (t.added.length === 0 && t.removed.length === 0) {
      sheet.addRow({ from, to, count: t.count, diff, type: "-", brand: "(변동 없음)" });
      continue;
    }

    for (const brand of t.added) {
      sheet.addRow({ from, to, count: t.count, diff, type: "신규 진입", brand });
    }

    for (const brand of t.removed) {
      sheet.addRow({ from, to, count: t.count, diff, type: "이탈", brand });
    }
  }

  // 헤더에 Excel 자동 필터(드롭다운 정렬/필터)를 켠다.
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columns.length },
  };

  // 스크롤해도 헤더 행이 계속 보이도록 고정.
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportBrandChangesToExcel(
  keyword: string,
  transitions: RunTransition[],
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  addKeywordSheet(workbook, keyword, transitions);
  await downloadWorkbook(workbook, `${keyword}_브랜드변동.xlsx`);
}

export interface KeywordTransitions {
  keyword: string;
  transitions: RunTransition[];
}

/**
 * 여러 키워드를 하나의 워크북에 키워드당 시트 1개로 담아 한 번에 다운로드한다.
 */
export async function exportMultipleBrandChangesToExcel(
  entries: KeywordTransitions[],
): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  for (const { keyword, transitions } of entries) {
    addKeywordSheet(workbook, keyword, transitions);
  }

  const today = new Date().toISOString().slice(0, 10);
  await downloadWorkbook(workbook, `브랜드변동_${today}.xlsx`);
}
