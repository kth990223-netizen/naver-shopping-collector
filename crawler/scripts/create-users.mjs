// Supabase Auth 계정을 대시보드 UI 없이 로컬에서 생성하는 1회성 스크립트.
//
// service_role 키와 계정 정보는 실행 중 터미널 입력으로만 받고 어디에도 저장하지 않는다.
// (이 파일 자체에는 비밀이 없으므로 git에 커밋해도 안전하다.)
// 주의: 입력값이 터미널 화면에 그대로 보인다 (다른 사람이 화면을 보고 있지 않은 곳에서 실행할 것).
//
// 준비물: Supabase 대시보드 > Settings > API 에서 "service_role" 키 확인 (한 번만 필요).
//
// 실행: crawler 폴더에서
//   node scripts/create-users.mjs
//
// 원하는 만큼 반복 실행해서 계정을 추가할 수 있다 (예: 본인 1개 + 친구 1개).

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error("crawler/.env에 SUPABASE_URL이 없습니다. 먼저 설정해주세요.");
  process.exit(1);
}

const rl = readline.createInterface({ input: stdin, output: stdout });

async function main() {
  console.log("Supabase 계정 생성 스크립트 (입력값은 파일로 저장되지 않습니다)");
  console.log("주의: 아래 입력은 터미널 화면에 그대로 표시됩니다.\n");

  const serviceRoleKey = await rl.question(
    "service_role 키 (대시보드 Settings > API): ",
  );

  if (!serviceRoleKey.trim()) {
    console.error("service_role 키가 필요합니다.");
    rl.close();
    process.exit(1);
  }

  const admin = createClient(SUPABASE_URL, serviceRoleKey.trim(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let creating = true;

  while (creating) {
    const email = await rl.question("\n생성할 계정 이메일: ");
    const password = await rl.question("비밀번호 (8자 이상): ");

    const { data, error } = await admin.auth.admin.createUser({
      email: email.trim(),
      password: password.trim(),
      email_confirm: true,
    });

    if (error) {
      console.error(`실패: ${error.message}`);
    } else {
      console.log(`생성 완료: ${data.user?.email} (id: ${data.user?.id})`);
    }

    const more = await rl.question("\n다른 계정도 만들까요? (y/N): ");
    creating = more.trim().toLowerCase() === "y";
  }

  console.log("\n완료. service_role 키는 이제 필요 없으니 따로 저장하지 마세요.");
  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
