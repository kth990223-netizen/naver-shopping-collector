import { useBrandChanges } from "../hooks/useBrandChanges";
import type { BrandChange } from "../services/brandChangeService";

function DiffBadge({ diffCount }: { diffCount: number }) {
  if (diffCount === 0) {
    return <span className="text-sm font-semibold text-slate-400">변동 없음</span>;
  }

  const positive = diffCount > 0;

  return (
    <span
      className={`text-sm font-semibold ${positive ? "text-blue-600" : "text-red-500"}`}
    >
      {positive ? `+${diffCount}` : diffCount}
    </span>
  );
}

function BrandTagList({ brands, tone }: { brands: string[]; tone: "added" | "removed" }) {
  if (brands.length === 0) {
    return <span className="text-sm text-slate-400">없음</span>;
  }

  const toneClass =
    tone === "added"
      ? "bg-blue-50 text-blue-700"
      : "bg-red-50 text-red-600";

  return (
    <div className="flex flex-wrap gap-2">
      {brands.map((brand) => (
        <span
          key={brand}
          className={`rounded-full px-3 py-1 text-xs font-medium ${toneClass}`}
        >
          {brand}
        </span>
      ))}
    </div>
  );
}

function ChangeCard({ change }: { change: BrandChange }) {
  const noPrevious = change.previousRunAt === null;

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{change.keyword}</h2>
          <p className="mt-1 text-xs text-slate-400">
            최근 수집: {new Date(change.latestRunAt).toLocaleString()}
            {!noPrevious && (
              <> · 이전 수집: {new Date(change.previousRunAt!).toLocaleString()}</>
            )}
          </p>
        </div>

        {!noPrevious && (
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">
              {change.previousCount} → {change.latestCount}
            </p>
            <DiffBadge diffCount={change.diffCount!} />
          </div>
        )}
      </div>

      {noPrevious ? (
        <p className="mt-4 text-sm text-slate-400">
          이 키워드는 아직 수집이 1회뿐이라 비교할 이전 데이터가 없습니다. (현재 브랜드 수:{" "}
          {change.latestCount}개)
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              신규 진입 ({change.added.length})
            </h3>
            <BrandTagList brands={change.added} tone="added" />
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              이탈 ({change.removed.length})
            </h3>
            <BrandTagList brands={change.removed} tone="removed" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function BrandChangePage() {
  const { data = [], isLoading } = useBrandChanges();

  if (isLoading) {
    return <h2 className="text-lg text-slate-500">Loading...</h2>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">브랜드 변동</h1>

      <p className="mt-2 mb-6 text-sm text-slate-500">
        키워드별로 가장 최근 수집과 그 이전 수집을 비교합니다.
      </p>

      {data.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow">
          수집된 데이터가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((change) => (
            <ChangeCard key={change.keyword} change={change} />
          ))}
        </div>
      )}
    </div>
  );
}
