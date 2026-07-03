import { supabase } from "../lib/supabase";
import type { Ad } from "../types/ad";

/**
 * 수집된 광고 목록을 collect_results에 새 로우로 누적 저장한다.
 * (같은 키워드를 다시 수집해도 기존 결과는 지우지 않고 계속 쌓는다.)
 */
export async function saveResults(ads: Ad[]): Promise<void> {
  if (ads.length === 0) return;

  const collectedAt = new Date().toISOString();

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
