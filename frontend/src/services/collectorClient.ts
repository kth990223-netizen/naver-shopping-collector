const CRAWLER_SERVER_URL = "http://localhost:8787";

export interface CollectorStatus {
  running: boolean;
  lastRunAt: string | null;
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

/**
 * 로컬 수집 서버 자체를 종료시킨다. 서버가 자기 자신에게 응답을 보낸 뒤
 * process.exit()하는 구조라, 응답이 안 와도(연결이 끊기며) 정상일 수 있다.
 */
export async function stopServer(): Promise<void> {
  const res = await fetch(`${CRAWLER_SERVER_URL}/shutdown`, { method: "POST" });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "서버 종료 실패");
  }
}
