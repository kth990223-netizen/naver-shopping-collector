import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseEmail = process.env.SUPABASE_EMAIL;
const supabasePassword = process.env.SUPABASE_PASSWORD;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "SUPABASE_URL / SUPABASE_ANON_KEY가 설정되지 않았습니다. crawler/.env를 확인해주세요."
  );
}

if (!supabaseEmail || !supabasePassword) {
  throw new Error(
    "SUPABASE_EMAIL / SUPABASE_PASSWORD가 설정되지 않았습니다. crawler/.env를 확인해주세요.\n" +
      "(brands/collect_results 쓰기는 RLS로 로그인한 사용자만 가능합니다. scripts/create-users.mjs로 계정을 만들어주세요.)"
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// brands/collect_results에 쓰려면 RLS 정책상 로그인(authenticated)이 필요하다.
// 이 promise를 await한 뒤부터 supabase 클라이언트의 모든 요청에 로그인 세션이 자동으로 실린다.
export const supabaseReady = supabase.auth
  .signInWithPassword({ email: supabaseEmail, password: supabasePassword })
  .then(({ error }) => {
    if (error) {
      throw new Error(`Supabase 로그인 실패: ${error.message}`);
    }
  });
