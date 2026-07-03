import { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Modal from "../components/common/Modal";
import { useKeywordHistories } from "../hooks/useKeywordHistories";
import {
  getTransitions,
  type KeywordHistory,
  type RunTransition,
} from "../services/brandChangeService";

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

function BrandTagList({ brands, tone }: { brands: string[]; tone: "added" | "removed" }) {
  if (brands.length === 0) {
    return <span className="text-sm text-slate-400">없음</span>;
  }

  const toneClass = tone === "added" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-600";

  return (
    <div className="flex flex-wrap gap-1.5">
      {brands.map((brand) => (
        <span key={brand} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClass}`}>
          {brand}
        </span>
      ))}
    </div>
  );
}

function KeywordChangeCard({
  history,
  onShowDetail,
}: {
  history: KeywordHistory;
  onShowDetail: () => void;
}) {
  const transitions = useMemo(() => getTransitions(history), [history]);
  const latest = transitions.at(-1);

  const chartData = history.runs.map((run) => ({
    date: formatShortDate(run.collectedAt),
    count: run.brands.length,
  }));

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{history.keyword}</h2>
          <p className="mt-1 text-xs text-slate-400">최근 {history.runs.length}회 수집 (최근 7일)</p>
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
          <BrandTagList brands={t.added} tone="added" />
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

function DetailModalBody({ transitions }: { transitions: RunTransition[] }) {
  const withChange = useMemo(
    () => transitions.filter((t) => t.fromRunAt !== null).reverse(),
    [transitions],
  );
  const [expanded, setExpanded] = useState(false);

  if (withChange.length === 0) {
    return <p className="text-sm text-slate-400">비교할 이전 수집 기록이 없습니다.</p>;
  }

  const [latestTransition, ...olderTransitions] = withChange;

  return (
    <div className="space-y-5">
      <TransitionEntry t={latestTransition} />

      {expanded &&
        olderTransitions.map((t) => <TransitionEntry key={t.toRunAt} t={t} />)}

      {olderTransitions.length > 0 && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          {expanded ? "접기" : `이전 기록 더보기 (${olderTransitions.length}건)`}
        </button>
      )}
    </div>
  );
}

export default function BrandChangePage() {
  const { data = [], isLoading } = useKeywordHistories();
  const [search, setSearch] = useState("");
  const [detailKeyword, setDetailKeyword] = useState<string | null>(null);

  const filtered = useMemo(
    () => data.filter((h) => h.keyword.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  const detailHistory = data.find((h) => h.keyword === detailKeyword) ?? null;

  if (isLoading) {
    return <h2 className="text-lg text-slate-500">Loading...</h2>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">브랜드 변동</h1>

      <p className="mt-2 mb-6 text-sm text-slate-500">
        키워드별 최근 7일간 브랜드 수 추이입니다. 상세보기에서 회차별 신규/이탈 브랜드를 확인할 수 있습니다.
      </p>

      <input
        placeholder="키워드 검색..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-5 w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow">
          {data.length === 0 ? "수집된 데이터가 없습니다." : "검색 결과가 없습니다."}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((history) => (
            <KeywordChangeCard
              key={history.keyword}
              history={history}
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
        {detailHistory && <DetailModalBody transitions={getTransitions(detailHistory)} />}
      </Modal>
    </div>
  );
}
