const CRAWLER_SERVER_URL = "http://localhost:8787";

export interface CollectorStatus {
  running: boolean;
  lastRunAt: string | null;
  lastResult: { keywordCount: number; totalAds: number } | null;
  lastError: string | null;
}

/**
 * 로컬에서 `npm run server`(crawler)로 띄운 헬퍼 서버 상태를 조회한다.
 * 배포된(Vercel) 사이트에서는 이 서버에 접근할 수 없으므로 항상 실패한다 — 의도된 동작.
 */
export async function getCollectorStatus(): Promise<CollectorStatus> {
  const res = await fetch(`${CRAWLER_SERVER_URL}/status`);

  if (!res.ok) throw new Error("로컬 수집 서버 상태 조회 실패");

  return res.json();
}

export async function startCollection(): Promise<void> {
  const res = await fetch(`${CRAWLER_SERVER_URL}/collect`, { method: "POST" });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "수집 시작 실패");
  }
}
