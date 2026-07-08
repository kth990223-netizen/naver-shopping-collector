import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useKeywordHistories } from "../hooks/useKeywordHistories";
import { buildRunSummaries } from "../utils/runSummary";
import { getTransitions } from "../services/brandChangeService";
import { useCollectorStatus, useStartCollection, useStopServer } from "../hooks/useCollector";
import { useCleanupOldResults } from "../hooks/useCleanupOldResults";
import { RESULT_RETENTION_DAYS } from "../services/cleanupService";
import { useAuth } from "../contexts/AuthContext";
import { loadSettings } from "../utils/settings";
import { sendWebhookNotification } from "../utils/notify";
import Skeleton from "../components/common/Skeleton";

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

function isCollectionStale(lastCollectedAtIso: string, thresholdDays: number): boolean {
  const diffDays = (Date.now() - new Date(lastCollectedAtIso).getTime()) / 86400000;
  return diffDays > thresholdDays;
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
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading } = useDashboardStats();
  const { data: histories = [] } = useKeywordHistories();
  const { data: collectorStatus, isError: collectorUnreachable } = useCollectorStatus();
  const startCollection = useStartCollection();
  const stopServer = useStopServer();
  const cleanup = useCleanupOldResults();
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const recentRuns = useMemo(() => buildRunSummaries(histories).slice(0, 3), [histories]);

  const newBrandsByKeyword = useMemo(() => {
    return histories
      .map((history) => {
        const transitions = getTransitions(history);
        const latest = transitions[transitions.length - 1];
        return latest && latest.added.length > 0
          ? { keyword: history.keyword, added: latest.added }
          : null;
      })
      .filter((entry): entry is { keyword: string; added: string[] } => entry !== null);
  }, [histories]);

  const settings = useMemo(() => loadSettings(), []);

  const isStale = data?.lastCollectedAt
    ? isCollectionStale(data.lastCollectedAt, settings.staleDaysThreshold)
    : false;

  const wasRunning = useRef(false);

  useEffect(() => {
    const running = collectorStatus?.running ?? false;

    if (wasRunning.current && !running) {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["keyword-histories"] });

      if (settings.webhookUrl) {
        const message = collectorStatus?.lastError
          ? `네이버 쇼핑 수집 실패: ${collectorStatus.lastError}`
          : "네이버 쇼핑 수집이 완료되었습니다.";

        sendWebhookNotification(settings.webhookUrl, message).catch(() => {
          // 알림 실패는 수집 결과와 무관하므로 조용히 무시한다.
        });
      }
    }

    wasRunning.current = running;
  }, [collectorStatus?.running, collectorStatus?.lastError, queryClient, settings.webhookUrl]);

  const lastCollected =
    data?.lastCollectedAt && data?.lastCollectedKeyword
      ? `${data.lastCollectedKeyword} · ${new Date(data.lastCollectedAt).toLocaleString()}`
      : "-";

  const isRunning = collectorStatus?.running ?? false;
  const confirmedIdle = collectorStatus?.running === false;
  const buttonDisabled = !confirmedIdle || startCollection.isPending;

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

          {startCollection.isError && (
            <span className="text-sm text-red-500">
              수집 시작 실패: {(startCollection.error as Error).message}
            </span>
          )}

          {stopServer.isError && (
            <span className="text-sm text-red-500">
              서버 종료 실패: {(stopServer.error as Error).message}
            </span>
          )}

          {cleanupMessage && <span className="text-sm text-slate-400">{cleanupMessage}</span>}

          {!authLoading && user && (
            <button
              onClick={handleCleanup}
              disabled={cleanup.isPending}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cleanup.isPending ? "삭제 중..." : `오래된 데이터 삭제 (${RESULT_RETENTION_DAYS}일+)`}
            </button>
          )}

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
        <div className="rounded-xl bg-white p-6 shadow transition-shadow duration-150 hover:shadow-lg">
          <h2 className="text-gray-500">총 키워드</h2>
          {isLoading ? (
            <>
              <Skeleton className="mt-3 h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </>
          ) : (
            <>
              <p className="mt-3 text-3xl font-bold">{data?.totalKeywords ?? 0}</p>
              <p className="mt-1 text-xs text-slate-400">
                활성 {data?.enabledKeywords ?? 0}개 · 비활성{" "}
                {(data?.totalKeywords ?? 0) - (data?.enabledKeywords ?? 0)}개
              </p>
            </>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow transition-shadow duration-150 hover:shadow-lg">
          <h2 className="text-gray-500">총 브랜드</h2>
          {isLoading ? (
            <Skeleton className="mt-3 h-8 w-16" />
          ) : (
            <p className="mt-3 text-3xl font-bold">{data?.totalBrands ?? 0}</p>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow transition-shadow duration-150 hover:shadow-lg">
          <h2 className="text-gray-500">오늘 수집</h2>
          {isLoading ? (
            <Skeleton className="mt-3 h-8 w-16" />
          ) : (
            <p className="mt-3 text-3xl font-bold">{data?.todayCollectedCount ?? 0}</p>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow transition-shadow duration-150 hover:shadow-lg">
          <h2 className="text-gray-500">마지막 수집</h2>
          {isLoading ? (
            <>
              <Skeleton className="mt-3 h-7 w-20" />
              <Skeleton className="mt-2 h-3 w-40" />
            </>
          ) : (
            <>
              <p className={`mt-3 text-2xl font-bold ${isStale ? "text-red-600" : ""}`}>
                {data?.lastCollectedAt ? formatElapsed(data.lastCollectedAt) : "-"}
              </p>
              <p className="mt-1 text-xs text-slate-400">{lastCollected}</p>
              {isStale && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  {settings.staleDaysThreshold}일 이상 수집이 없습니다.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {newBrandsByKeyword.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 shadow">
          <h2 className="mb-3 font-semibold text-amber-800">최근 실행에서 새로 발견된 브랜드</h2>
          <ul className="space-y-1 text-sm text-amber-900">
            {newBrandsByKeyword.map(({ keyword, added }) => (
              <li key={keyword}>
                <span className="font-semibold">{keyword}</span>: {added.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-gray-500">최근 실행 요약</h2>

        {recentRuns.length === 0 ? (
          <p className="text-sm text-slate-400">수집 실행 기록이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {recentRuns.map((run) => (
              <div
                key={run.startedAt}
                className="grid grid-cols-2 gap-6 border-b border-slate-100 pb-4 last:border-0 last:pb-0 md:grid-cols-4"
              >
                <div>
                  <p className="text-xs text-slate-400">수집 시각</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {new Date(run.startedAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">
                    ~ {new Date(run.endedAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">소요 시간</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatDuration(run.startedAt, run.endedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">수집 키워드</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{run.keywords.length}개</p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">총 수집건수</p>
                  <p className="mt-1 text-2xl font-bold text-blue-600">{run.total}건</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
