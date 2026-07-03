import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useCollectorStatus, useStartCollection } from "../hooks/useCollector";

export default function DashboardPage() {
  const { data, isLoading } = useDashboardStats();
  const { data: collectorStatus, isError: collectorUnreachable } = useCollectorStatus();
  const startCollection = useStartCollection();
  const queryClient = useQueryClient();

  const wasRunning = useRef(false);

  useEffect(() => {
    const running = collectorStatus?.running ?? false;

    if (wasRunning.current && !running) {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    }

    wasRunning.current = running;
  }, [collectorStatus?.running, queryClient]);

  const lastCollected =
    data?.lastCollectedAt && data?.lastCollectedKeyword
      ? `${data.lastCollectedKeyword} · ${new Date(data.lastCollectedAt).toLocaleString()}`
      : "-";

  const isRunning = collectorStatus?.running ?? false;
  const buttonDisabled = collectorUnreachable || isRunning || startCollection.isPending;

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="flex items-center gap-3">
          {collectorUnreachable && (
            <span className="text-sm text-red-500">
              로컬 수집 서버에 연결할 수 없습니다 (crawler에서 npm run server 실행 필요)
            </span>
          )}

          {!collectorUnreachable && collectorStatus?.lastError && (
            <span className="text-sm text-red-500">
              마지막 수집 실패: {collectorStatus.lastError}
            </span>
          )}

          <button
            onClick={() => startCollection.mutate()}
            disabled={buttonDisabled}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? "수집 중..." : "수집 시작"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-gray-500">총 키워드</h2>
          <p className="mt-3 text-3xl font-bold">
            {isLoading ? "-" : data?.totalKeywords ?? 0}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-gray-500">총 브랜드</h2>
          <p className="mt-3 text-3xl font-bold">
            {isLoading ? "-" : data?.totalBrands ?? 0}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-gray-500">오늘 수집</h2>
          <p className="mt-3 text-3xl font-bold">
            {isLoading ? "-" : data?.todayCollectedCount ?? 0}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-gray-500">최근 수집</h2>
          <p className="mt-3 text-lg font-semibold">
            {isLoading ? "-" : lastCollected}
          </p>
        </div>
      </div>
    </>
  );
}
