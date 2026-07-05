import { supabase } from "../lib/supabase";
import { getKeywords } from "./keywordService";

// collect_results 조회 범위(일). crawler의 RESULT_RETENTION_DAYS와 맞춘다.
const HISTORY_WINDOW_DAYS = 7;

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
 * 키워드 하나의 최근 수집 실행(run)들을 시간순으로 묶어서 반환한다.
 * 같은 수집 실행에서 저장된 행들은 collected_at 값이 동일하므로 이를 묶음 기준으로 쓴다.
 * 수집 데이터가 없으면 null.
 */
async function getKeywordHistory(
  keyword: string,
  sinceIso: string,
): Promise<KeywordHistory | null> {
  const { data, error } = await supabase
    .from("collect_results")
    .select("brand_name, collected_at")
    .eq("keyword", keyword)
    .gte("collected_at", sinceIso)
    .order("collected_at", { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const runsMap = new Map<string, Set<string>>();

  for (const row of data) {
    if (!runsMap.has(row.collected_at)) {
      runsMap.set(row.collected_at, new Set());
    }
    // brand_name이 null인 행은 "광고 0건" 마커다. 실행(collected_at) 자체는 등록하되
    // 브랜드 집합에는 넣지 않아, 그 회차가 0개로 집계되게 한다.
    if (row.brand_name) {
      runsMap.get(row.collected_at)!.add(row.brand_name);
    }
  }

  const runs = [...runsMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([collectedAt, brandSet]) => ({
      collectedAt,
      brands: [...brandSet].sort(),
    }));

  return { keyword, runs };
}

/**
 * 키워드별로 최근 HISTORY_WINDOW_DAYS일의 수집 이력을 묶어서 반환한다.
 *
 * 전체 collect_results를 한 번에 조회하면 Supabase/PostgREST의 기본 1000행 제한에
 * 걸려 데이터가 잘린다(하루치만 돼도 초과). 그래서 keywords 테이블에서 키워드 목록을
 * 받아 **키워드별로 개별 쿼리**를 병렬 실행한다 — 각 쿼리는 (키워드 + 7일)로 좁혀져
 * 1000행을 넘지 않으므로 잘리지 않는다.
 *
 * (수집 데이터가 없는 키워드는 제외. keywords 테이블 기준이라, 등록 해제된 키워드는
 *  최근 데이터가 있어도 표시되지 않는다.)
 */
export async function getKeywordHistories(): Promise<KeywordHistory[]> {
  const keywords = await getKeywords();

  const since = new Date();
  since.setDate(since.getDate() - HISTORY_WINDOW_DAYS);
  const sinceIso = since.toISOString();

  const results = await Promise.all(
    keywords.map((k) => getKeywordHistory(k.keyword, sinceIso)),
  );

  return results
    .filter((h): h is KeywordHistory => h !== null)
    .sort((a, b) => a.keyword.localeCompare(b.keyword));
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
