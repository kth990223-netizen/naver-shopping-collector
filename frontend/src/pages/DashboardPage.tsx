import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useKeywordHistories } from "../hooks/useKeywordHistories";
import { buildRunSummaries } from "../utils/runSummary";
import { useCollectorStatus, useStartCollection, useStopServer } from "../hooks/useCollector";
import { useCleanupOldResults } from "../hooks/useCleanupOldResults";
import { RESULT_RETENTION_DAYS } from "../services/cleanupService";

// "N분 전 / N시간 전 / N일 전" 형태로 경과 시간을 표시한다.
function formatElapsed(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

// 두 시각 사이 소요 시간을 "X시간 Y분" 형태로 표시한다.
function formatDuration(startIso: string, endIso: string): string {
  const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
  const totalMin = Math.max(0, Math.round(diffMs / 60000));
  const hours = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return hours > 0 ? `${hours}시간 ${min}분` : `${min}분`;
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboardStats();
  const { data: histories = [] } = useKeywordHistories();
  const { data: collectorStatus, isError: collectorUnreachable } = useCollectorStatus();
  const startCollection = useStartCollection();
  const stopServer = useStopServer();
  const cleanup = useCleanupOldResults();
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const latestRun = useMemo(() => buildRunSummaries(histories)[0] ?? null, [histories]);

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
          <p className="mt-1 text-xs text-slate-400">
            {isLoading ? "" : `활성 ${data?.enabledKeywords ?? 0}개 · 비활성 ${(data?.totalKeywords ?? 0) - (data?.enabledKeywords ?? 0)}개`}
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
          <h2 className="text-gray-500">마지막 수집</h2>
          <p className="mt-3 text-2xl font-bold">
            {isLoading || !data?.lastCollectedAt
              ? "-"
              : formatElapsed(data.lastCollectedAt)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {isLoading ? "" : lastCollected}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-gray-500">최근 실행 요약</h2>

        {!latestRun ? (
          <p className="text-sm text-slate-400">수집 실행 기록이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">수집 시각</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {new Date(latestRun.startedAt).toLocaleString()}
              </p>
              <p className="text-xs text-slate-400">
                ~ {new Date(latestRun.endedAt).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">소요 시간</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatDuration(latestRun.startedAt, latestRun.endedAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">수집 키워드</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {latestRun.keywords.length}개
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">총 수집건수</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {latestRun.total}건
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
