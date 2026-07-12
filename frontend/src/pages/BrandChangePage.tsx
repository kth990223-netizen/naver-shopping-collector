import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Modal from "../components/common/Modal";
import Skeleton from "../components/common/Skeleton";
import { useKeywordHistories } from "../hooks/useKeywordHistories";
import {
  getTransitions,
  type KeywordHistory,
  type RunTransition,
} from "../services/brandChangeService";
import {
  exportBrandChangesToExcel,
  exportMultipleBrandChangesToExcel,
} from "../utils/exportBrandChanges";

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function DiffText({ diffCount }: { diffCount: number | null }) {
  if (diffCount === null) return null;

  if (diffCount === 0) {
    return <span className="text-sm font-semibold text-slate-400">변동 없음</span>;
  }

  const positive = diffCount > 0;

  return (
    <span className={`text-sm font-semibold ${positive ? "text-blue-600" : "text-red-500"}`}>
      {positive ? `+${diffCount}` : diffCount}
    </span>
  );
}

function BrandTagList({
  brands,
  tone,
  pages,
}: {
  brands: string[];
  tone: "added" | "removed";
  // 브랜드 → 발견 페이지. page 컬럼 도입 전 데이터는 항목이 없어 배지가 생략된다.
  pages?: Record<string, number>;
}) {
  if (brands.length === 0) {
    return <span className="text-sm text-slate-400">없음</span>;
  }

  const toneClass = tone === "added" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-600";

  return (
    <div className="flex flex-wrap gap-1.5">
      {brands.map((brand) => (
        <span key={brand} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClass}`}>
          {brand}
          {pages?.[brand] !== undefined && (
            <span className="ml-1 opacity-60">{pages[brand]}p</span>
          )}
        </span>
      ))}
    </div>
  );
}

function KeywordChangeCard({
  history,
  selected,
  onToggleSelect,
  onShowDetail,
}: {
  history: KeywordHistory;
  selected: boolean;
  onToggleSelect: () => void;
  onShowDetail: () => void;
}) {
  const transitions = useMemo(() => getTransitions(history), [history]);
  const latest = transitions.at(-1);

  const chartData = history.runs.map((run) => ({
    date: formatShortDate(run.collectedAt),
    count: run.brands.length,
  }));

  return (
    <div className="rounded-xl bg-white p-6 shadow transition-shadow duration-150 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="mt-1.5 h-4 w-4 accent-blue-600"
            aria-label={`${history.keyword} 선택`}
          />

          <div>
            <h2 className="text-lg font-bold text-slate-900">{history.keyword}</h2>
            <p className="mt-1 text-xs text-slate-400">최근 {history.runs.length}회 수집 (최근 7일)</p>
          </div>
        </div>

        {latest && (
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{latest.count}개</p>
            <DiffText diffCount={latest.diffCount} />
          </div>
        )}
      </div>

      {chartData.length < 2 ? (
        <p className="mt-4 text-sm text-slate-400">
          아직 수집이 {chartData.length}회뿐이라 추이를 표시할 데이터가 부족합니다.
        </p>
      ) : (
        <div className="mt-4 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <button
        onClick={onShowDetail}
        className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
      >
        상세보기
      </button>
    </div>
  );
}

function TransitionEntry({ t }: { t: RunTransition }) {
  return (
    <div className="border-b border-slate-100 pb-4 last:border-0">
      <p className="text-xs text-slate-400">
        {new Date(t.fromRunAt!).toLocaleString()} → {new Date(t.toRunAt).toLocaleString()}
        {"  "}
        <DiffText diffCount={t.diffCount} />
      </p>

      <div className="mt-2 grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-1 text-xs font-semibold uppercase text-slate-400">
            신규 진입 ({t.added.length})
          </h4>
          <BrandTagList brands={t.added} tone="added" pages={t.toPages} />
        </div>

        <div>
          <h4 className="mb-1 text-xs font-semibold uppercase text-slate-400">
            이탈 ({t.removed.length})
          </h4>
          <BrandTagList brands={t.removed} tone="removed" />
        </div>
      </div>
    </div>
  );
}

function DetailModalBody({
  keyword,
  transitions,
}: {
  keyword: string;
  transitions: RunTransition[];
}) {
  const withChange = useMemo(
    () => transitions.filter((t) => t.fromRunAt !== null).reverse(),
    [transitions],
  );
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (withChange.length === 0) {
    return <p className="text-sm text-slate-400">비교할 이전 수집 기록이 없습니다.</p>;
  }

  const [latestTransition, ...olderTransitions] = withChange;

  async function handleExportExcel() {
    setExporting(true);
    try {
      await exportBrandChangesToExcel(keyword, withChange);
    } finally {
      setExporting(false);
    }
  }

  function handlePrint() {
    // 인쇄에는 전체 기록이 담겨야 하므로, 접혀있으면 먼저 펼친 뒤
    // 화면이 그 내용으로 다시 그려질 시간을 주고 인쇄 대화상자를 연다.
    setExpanded(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  }

  return (
    <div className="space-y-5">
      <div className="no-print flex gap-3 border-b border-slate-100 pb-4">
        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="text-sm font-semibold text-blue-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? "내보내는 중..." : "Excel 다운로드"}
        </button>

        <button
          onClick={handlePrint}
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          PDF로 저장 (인쇄)
        </button>
      </div>

      <TransitionEntry t={latestTransition} />

      {expanded &&
        olderTransitions.map((t) => <TransitionEntry key={t.toRunAt} t={t} />)}

      {olderTransitions.length > 0 && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="no-print text-sm font-semibold text-blue-600 hover:underline"
        >
          {expanded ? "접기" : `이전 기록 더보기 (${olderTransitions.length}건)`}
        </button>
      )}
    </div>
  );
}

/**
 * 여러 키워드 선택 인쇄(PDF) 전용 뷰. 화면에는 보이지 않고(hidden) 인쇄할 때만
 * 나타난다(print:block). 키워드마다 페이지를 분리하고(break-after-page),
 * 제목에 키워드명을 넣어 PDF 뷰어에서 텍스트 검색(Ctrl+F)으로 바로 찾을 수 있게 한다.
 */
function MultiPrintReport({ histories }: { histories: KeywordHistory[] }) {
  return (
    <div className="print-area hidden print:block">
      {histories.map((history, i) => {
        const transitions = getTransitions(history).filter((t) => t.fromRunAt !== null);

        return (
          <div
            key={history.keyword}
            className={i < histories.length - 1 ? "break-after-page" : undefined}
          >
            <h1 className="mb-4 text-2xl font-bold text-slate-900">
              브랜드 변동 — {history.keyword}
            </h1>

            {transitions.length === 0 ? (
              <p className="text-sm text-slate-400">비교할 이전 수집 기록이 없습니다.</p>
            ) : (
              <div className="space-y-5">
                {transitions
                  .slice()
                  .reverse()
                  .map((t) => (
                    <TransitionEntry key={t.toRunAt} t={t} />
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function BrandChangePage() {
  const { data = [], isLoading } = useKeywordHistories();
  const [search, setSearch] = useState("");
  const [detailKeyword, setDetailKeyword] = useState<string | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [printSelection, setPrintSelection] = useState<KeywordHistory[] | null>(null);
  const [exportingSelection, setExportingSelection] = useState(false);
  const [columns, setColumns] = useState(4);

  const filtered = useMemo(
    () => data.filter((h) => h.keyword.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const detailHistory = data.find((h) => h.keyword === detailKeyword) ?? null;
  const selectedHistories = data.filter((h) => selectedKeywords.has(h.keyword));

  useEffect(() => {
    if (!printSelection) return;

    const clear = () => setPrintSelection(null);
    window.addEventListener("afterprint", clear);
    return () => window.removeEventListener("afterprint", clear);
  }, [printSelection]);

  function toggleSelect(keyword: string) {
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) {
        next.delete(keyword);
      } else {
        next.add(keyword);
      }
      return next;
    });
  }

  async function handleExportSelectionExcel() {
    setExportingSelection(true);
    try {
      await exportMultipleBrandChangesToExcel(
        selectedHistories.map((history) => ({
          keyword: history.keyword,
          transitions: getTransitions(history),
        })),
      );
    } finally {
      setExportingSelection(false);
    }
  }

  function handlePrintSelection() {
    setPrintSelection(selectedHistories);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  }

  if (isLoading) {
    return (
      <div>
        <Skeleton className="mb-6 h-8 w-32" />
        <Skeleton className="mb-6 h-4 w-96" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white p-6 shadow">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-2 h-3 w-32" />
              <Skeleton className="mt-6 h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">브랜드 변동</h1>

      <p className="mt-2 mb-6 text-sm text-slate-500">
        키워드별 최근 7일간 브랜드 수 추이입니다. 상세보기에서 회차별 신규/이탈 브랜드를 확인할 수 있습니다.
      </p>

      <div className="no-print mb-5 flex items-center gap-3">
        <input
          placeholder="키워드 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        <label className="flex items-center gap-2 text-sm text-slate-500">
          한 줄에
          <input
            type="number"
            min={1}
            max={6}
            value={columns}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setColumns(Math.min(6, Math.max(1, n)));
            }}
            className="w-16 rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          개
        </label>

        {selectedKeywords.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-2 text-sm">
            <span className="font-medium text-blue-700">
              {selectedKeywords.size}개 선택됨
            </span>

            <button
              onClick={handleExportSelectionExcel}
              disabled={exportingSelection}
              className="font-semibold text-blue-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exportingSelection ? "내보내는 중..." : "Excel 다운로드"}
            </button>

            <button
              onClick={handlePrintSelection}
              className="font-semibold text-blue-600 hover:underline"
            >
              PDF로 저장 (인쇄)
            </button>

            <button
              onClick={() => setSelectedKeywords(new Set())}
              className="text-slate-500 hover:underline"
            >
              선택 해제
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow">
          {data.length === 0 ? "수집된 데이터가 없습니다." : "검색 결과가 없습니다."}
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {filtered.map((history) => (
            <KeywordChangeCard
              key={history.keyword}
              history={history}
              selected={selectedKeywords.has(history.keyword)}
              onToggleSelect={() => toggleSelect(history.keyword)}
              onShowDetail={() => setDetailKeyword(history.keyword)}
            />
          ))}
        </div>
      )}

      <Modal
        open={detailHistory !== null}
        onClose={() => setDetailKeyword(null)}
        title={detailHistory ? `${detailHistory.keyword} — 회차별 변동` : ""}
      >
        {detailHistory && (
          <DetailModalBody
            keyword={detailHistory.keyword}
            transitions={getTransitions(detailHistory)}
          />
        )}
      </Modal>

      {printSelection && <MultiPrintReport histories={printSelection} />}
    </div>
  );
}
