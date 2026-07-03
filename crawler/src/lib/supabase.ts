import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "SUPABASE_URL / SUPABASE_ANON_KEY가 설정되지 않았습니다. crawler/.env를 확인해주세요."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
