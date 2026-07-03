import { supabase } from "../lib/supabase";

export interface BrandChange {
  keyword: string;
  latestRunAt: string;
  previousRunAt: string | null;
  latestCount: number;
  previousCount: number | null;
  diffCount: number | null;
  added: string[];
  removed: string[];
}

/**
 * 키워드별로 가장 최근 수집(run)과 그 이전 수집을 비교해서
 * 신규 진입/이탈 브랜드와 개수 차이를 계산한다.
 *
 * "오늘/어제"가 아니라 "가장 최근 수집 vs 그 이전 수집"으로 비교한다 —
 * 매일 수집이 돌아간다는 보장이 없어서, 달력 날짜보다 실제 수집 회차 기준이 안전하다.
 * 같은 수집 실행(run)에서 저장된 행들은 collected_at 값이 동일하므로 이를 묶음 기준으로 쓴다.
 */
export async function getBrandChanges(): Promise<BrandChange[]> {
  const { data, error } = await supabase
    .from("collect_results")
    .select("keyword, brand_name, collected_at")
    .order("collected_at", { ascending: false });

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

  const changes: BrandChange[] = [];

  for (const [keyword, runs] of byKeyword) {
    // collected_at은 ISO 문자열이라 문자열 정렬이 곧 시간순 정렬이다.
    const runTimestamps = [...runs.keys()].sort((a, b) => b.localeCompare(a));

    const [latestAt, previousAt] = runTimestamps;
    const latestBrands = runs.get(latestAt)!;

    if (!previousAt) {
      changes.push({
        keyword,
        latestRunAt: latestAt,
        previousRunAt: null,
        latestCount: latestBrands.size,
        previousCount: null,
        diffCount: null,
        added: [],
        removed: [],
      });
      continue;
    }

    const previousBrands = runs.get(previousAt)!;

    const added = [...latestBrands].filter((b) => !previousBrands.has(b)).sort();
    const removed = [...previousBrands].filter((b) => !latestBrands.has(b)).sort();

    changes.push({
      keyword,
      latestRunAt: latestAt,
      previousRunAt: previousAt,
      latestCount: latestBrands.size,
      previousCount: previousBrands.size,
      diffCount: latestBrands.size - previousBrands.size,
      added,
      removed,
    });
  }

  return changes.sort((a, b) => a.keyword.localeCompare(b.keyword));
}
