import { supabase } from "../lib/supabase";
import type { Keyword } from "../types/keyword";

/**
 * frontend에서 관리하는 keywords 테이블 중 활성화(enabled=true)된 키워드만 가져온다.
 */
export async function getEnabledKeywords(): Promise<Keyword[]> {
  const { data, error } = await supabase
    .from("keywords")
    .select("*")
    .eq("enabled", true)
    .order("keyword");

  if (error) throw error;

  return data as Keyword[];
}
