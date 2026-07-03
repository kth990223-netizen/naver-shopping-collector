import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useCollectorStatus, useStartCollection, useStopServer } from "../hooks/useCollector";
import { useCleanupOldResults } from "../hooks/useCleanupOldResults";
import { RESULT_RETENTION_DAYS } from "../services/cleanupService";

export default function DashboardPage() {
  const { data, isLoading } = useDashboardStats();
  const { data: collectorStatus, isError: collectorUnreachable } = useCollectorStatus();
  const startCollection = useStartCollection();
  const stopServer = useStopServer();
  const cleanup = useCleanupOldResults();
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
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

  async function handleCleanup() {
    const confirmed = window.confirm(
      `수집 후 ${RESULT_RETENTION_DAYS}일이 지난 수집 결과를 모두 삭제합니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?`,
    );

    if (!confirmed) return;

    try {
      const deletedCount = await cleanup.mutateAsync();
      setCleanupMessage(`${deletedCount}건 삭제되었습니다.`);
    } catch (err) {
      setCleanupMessage(`삭제 실패: ${(err as Error).message}`);
    }
  }

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

          {cleanupMessage && <span className="text-sm text-slate-400">{cleanupMessage}</span>}

          <button
            onClick={handleCleanup}
            disabled={cleanup.isPending}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cleanup.isPending ? "삭제 중..." : `오래된 데이터 삭제 (${RESULT_RETENTION_DAYS}일+)`}
          </button>

          <button
            onClick={() => startCollection.mutate()}
            disabled={buttonDisabled}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? "수집 중..." : "수집 시작"}
          </button>

          <button
            onClick={() => stopServer.mutate()}
            disabled={collectorUnreachable || isRunning || stopServer.isPending}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {stopServer.isPending ? "종료 중..." : "로컬 서버 종료"}
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
