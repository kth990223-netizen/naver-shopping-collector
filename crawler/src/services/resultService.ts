import { supabase } from "../lib/supabase";
import { RESULT_RETENTION_DAYS } from "../config/constants";
import type { Ad } from "../types/ad";

/**
 * 수집된 광고 목록을 collect_results에 새 로우로 누적 저장한다.
 * (같은 키워드를 다시 수집해도 기존 결과는 지우지 않고 계속 쌓는다.)
 *
 * 광고가 0건이어도 "시도했으나 광고 없음"을 기록으로 남긴다 (brand_name=null 마커 1행).
 * 이렇게 해야 "0건 수집"과 "아예 미수집"이 구분되고, 브랜드 변동 페이지에서
 * 이전 브랜드가 전부 이탈(→0)한 것으로 보인다.
 */
export async function saveResults(keyword: string, ads: Ad[]): Promise<void> {
  const collectedAt = new Date().toISOString();

  if (ads.length === 0) {
    const { error } = await supabase.from("collect_results").insert({
      keyword,
      brand_name: null,
      product_name: null,
      product_url: null,
      ad_rank: 0,
      collected_at: collectedAt,
    });

    if (error) throw error;
    return;
  }

  const rows = ads.map((ad) => ({
    keyword: ad.keyword,
    brand_name: ad.mallName,
    product_name: ad.productTitle,
    product_url: ad.productUrl || null,
    ad_rank: ad.rank,
    collected_at: collectedAt,
  }));

  const { error } = await supabase.from("collect_results").insert(rows);

  if (error) throw error;
}

/**
 * RESULT_RETENTION_DAYS보다 오래된 collect_results 행을 삭제한다.
 * 프론트엔드 "브랜드 변동" 페이지가 별도 날짜 필터 없이 전체 조회해도
 * 항상 최근 RESULT_RETENTION_DAYS일치만 남아있도록 보장하기 위함이다.
 */
export async function deleteOldResults(): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RESULT_RETENTION_DAYS);

  const { error } = await supabase
    .from("collect_results")
    .delete()
    .lt("collected_at", cutoff.toISOString());

  if (error) throw error;
}
