import { supabase } from "../lib/supabase";

/**
 * 이번 수집에서 등장한 브랜드(mallName)들을 brands 테이블에 반영한다.
 * 처음 보는 브랜드는 새로 추가(first_seen=last_seen=지금), 이미 있으면 last_seen만 갱신한다.
 */
export async function upsertBrandsSeen(brandNames: string[]): Promise<void> {
  const uniqueNames = [...new Set(brandNames)].filter(Boolean);

  if (uniqueNames.length === 0) return;

  const now = new Date().toISOString();

  const { data: existing, error: selectError } = await supabase
    .from("brands")
    .select("brand_name")
    .in("brand_name", uniqueNames);

  if (selectError) throw selectError;

  const existingNames = new Set((existing ?? []).map((b) => b.brand_name));

  const toUpdate = uniqueNames.filter((name) => existingNames.has(name));
  const toInsert = uniqueNames.filter((name) => !existingNames.has(name));

  if (toUpdate.length > 0) {
    const { error } = await supabase
      .from("brands")
      .update({ last_seen: now })
      .in("brand_name", toUpdate);

    if (error) throw error;
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("brands").insert(
      toInsert.map((brand_name) => ({
        brand_name,
        first_seen: now,
        last_seen: now,
      }))
    );

    if (error) throw error;
  }
}
