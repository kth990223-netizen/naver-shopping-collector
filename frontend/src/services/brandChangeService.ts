import { supabase } from "../lib/supabase";

export interface RunSnapshot {
  collectedAt: string;
  brands: string[];
}

export interface KeywordHistory {
  keyword: string;
  runs: RunSnapshot[]; // collectedAt 오름차순
}

export interface RunTransition {
  fromRunAt: string | null;
  toRunAt: string;
  count: number;
  diffCount: number | null;
  added: string[];
  removed: string[];
}

/**
 * 키워드별로 수집 실행(run)을 시간순으로 묶어서 반환한다.
 * 같은 수집 실행에서 저장된 행들은 collected_at 값이 동일하므로 이를 묶음 기준으로 쓴다.
 *
 * 여기서는 날짜로 따로 필터링하지 않는다 — crawler가 매 수집 실행마다
 * RESULT_RETENTION_DAYS(7일)보다 오래된 collect_results 행을 삭제하므로,
 * 이 테이블에는 항상 최근 7일치만 남아있다는 전제로 전체 조회한다.
 */
export async function getKeywordHistories(): Promise<KeywordHistory[]> {
  const { data, error } = await supabase
    .from("collect_results")
    .select("keyword, brand_name, collected_at")
    .order("collected_at", { ascending: true });

  if (error) throw error;

  const byKeyword = new Map<string, Map<string, Set<string>>>();

  for (const row of data ?? []) {
    if (!byKeyword.has(row.keyword)) {
      byKeyword.set(row.keyword, new Map());
    }

    const runs = byKeyword.get(row.keyword)!;

    if (!runs.has(row.collected_at)) {
      runs.set(row.collected_at, new Set());
    }

    runs.get(row.collected_at)!.add(row.brand_name);
  }

  const histories: KeywordHistory[] = [];

  for (const [keyword, runsMap] of byKeyword) {
    const runs = [...runsMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([collectedAt, brandSet]) => ({
        collectedAt,
        brands: [...brandSet].sort(),
      }));

    histories.push({ keyword, runs });
  }

  return histories.sort((a, b) => a.keyword.localeCompare(b.keyword));
}

/**
 * 한 키워드의 수집 회차들을 연속된 쌍으로 비교해서 회차별 신규/이탈 브랜드를 계산한다.
 * (순수 함수 — Supabase 호출 없음)
 */
export function getTransitions(history: KeywordHistory): RunTransition[] {
  return history.runs.map((run, i) => {
    const prev = history.runs[i - 1];

    if (!prev) {
      return {
        fromRunAt: null,
        toRunAt: run.collectedAt,
        count: run.brands.length,
        diffCount: null,
        added: [],
        removed: [],
      };
    }

    const prevSet = new Set(prev.brands);
    const currSet = new Set(run.brands);

    return {
      fromRunAt: prev.collectedAt,
      toRunAt: run.collectedAt,
      count: run.brands.length,
      diffCount: run.brands.length - prev.brands.length,
      added: run.brands.filter((b) => !prevSet.has(b)),
      removed: prev.brands.filter((b) => !currSet.has(b)),
    };
  });
}
