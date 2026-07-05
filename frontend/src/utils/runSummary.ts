import type { KeywordHistory } from "../services/brandChangeService";

// 수집 실행(run)을 나누는 시간 간격(ms). 한 번의 수집 실행에서는 키워드들이 수 분 간격으로
// 순차 저장되므로, 이보다 큰 공백이 생기면 다른 수집 실행으로 본다.
// (collect_results에 실행 식별자가 없어 collected_at 간격으로 추정하는 방식)
const RUN_GAP_MS = 90 * 60 * 1000;

export interface RunKeywordCount {
  keyword: string;
  count: number;
}

export interface RunSummary {
  startedAt: string;
  endedAt: string;
  total: number;
  keywords: RunKeywordCount[];
}

interface Entry {
  at: string;
  keyword: string;
  count: number;
}

function toSummary(entries: Entry[]): RunSummary {
  const keywords = entries
    .map((e) => ({ keyword: e.keyword, count: e.count }))
    .sort((a, b) => a.keyword.localeCompare(b.keyword, "ko"));

  const times = entries.map((e) => e.at).sort();

  return {
    startedAt: times[0],
    endedAt: times[times.length - 1],
    total: entries.reduce((sum, e) => sum + e.count, 0),
    keywords,
  };
}

/**
 * 키워드별 수집 이력을 "수집 실행(run)" 단위로 묶어 요약한다.
 * collected_at을 시간순으로 정렬한 뒤 RUN_GAP_MS보다 큰 공백에서 실행을 나눈다.
 * 각 실행마다 시작/종료 시각, 키워드별 건수, 총 건수를 계산한다. (최신 실행이 먼저)
 */
export function buildRunSummaries(histories: KeywordHistory[]): RunSummary[] {
  const entries: Entry[] = [];

  for (const h of histories) {
    for (const run of h.runs) {
      entries.push({ at: run.collectedAt, keyword: h.keyword, count: run.brands.length });
    }
  }

  entries.sort((a, b) => a.at.localeCompare(b.at));

  const runs: RunSummary[] = [];
  let current: Entry[] = [];
  let lastTime = 0;

  for (const entry of entries) {
    const t = new Date(entry.at).getTime();

    if (current.length > 0 && t - lastTime > RUN_GAP_MS) {
      runs.push(toSummary(current));
      current = [];
    }

    current.push(entry);
    lastTime = t;
  }

  if (current.length > 0) {
    runs.push(toSummary(current));
  }

  return runs.reverse();
}
