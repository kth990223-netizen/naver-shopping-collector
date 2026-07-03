import { supabase } from "../lib/supabase";

// crawler/src/config/constants.ts의 RESULT_RETENTION_DAYS와 값을 맞춰야 한다.
export const RESULT_RETENTION_DAYS = 7;

/**
 * collected_at이 RESULT_RETENTION_DAYS일보다 오래된 collect_results 행을 삭제한다.
 * Chrome/크롤러와 무관한 순수 DB 작업이라 로컬 서버 없이도(배포된 사이트에서도) 동작한다.
 */
export async function deleteOldResults(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RESULT_RETENTION_DAYS);

  const { error, count } = await supabase
    .from("collect_results")
    .delete({ count: "exact" })
    .lt("collected_at", cutoff.toISOString());

  if (error) throw error;

  return count ?? 0;
}
