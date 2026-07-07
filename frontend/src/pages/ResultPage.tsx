import { useMemo } from "react";
import { useKeywordHistories } from "../hooks/useKeywordHistories";
import { buildRunSummaries } from "../utils/runSummary";
import Skeleton from "../components/common/Skeleton";

function RunCardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function ResultPage() {
  const { data = [], isLoading } = useKeywordHistories();

  const runs = useMemo(() => buildRunSummaries(data), [data]);

  if (isLoading) {
    return (
      <div>
        <Skeleton className="mb-6 h-8 w-32" />
        <Skeleton className="mb-6 h-4 w-64" />
        <div className="space-y-4">
          <RunCardSkeleton />
          <RunCardSkeleton />
          <RunCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">수집 결과</h1>

      <p className="mt-2 mb-6 text-sm text-slate-500">
        최근 7일간 수집 실행 {runs.length}회. 실행별로 수집된 키워드와 건수를 보여줍니다.
      </p>

      {runs.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow">
          수집된 데이터가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <div key={run.startedAt} className="rounded-xl bg-white p-6 shadow">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date(run.startedAt).toLocaleString()}
                    {" ~ "}
                    {new Date(run.endedAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    수집 키워드 {run.keywords.length}개
                  </p>
                </div>

                <p className="text-lg font-bold text-blue-600">총 {run.total}건</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-3 lg:grid-cols-4">
                {run.keywords.map((k) => (
                  <div
                    key={k.keyword}
                    className="flex justify-between border-b border-slate-50 py-1 text-sm"
                  >
                    <span className="truncate text-slate-700">{k.keyword}</span>
                    <span className="ml-2 shrink-0 font-medium text-slate-500">
                      {k.count}건
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
