import { spawn } from "node:child_process";
import fs from "node:fs";
import { CDP_PORT, CDP_PROFILE_DIR } from "../config/constants";

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

function findChromePath(): string {
  const found = CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate));

  if (!found) {
    throw new Error(
      `Chrome 실행 파일을 찾지 못했습니다. 다음 경로들을 확인해주세요:\n${CHROME_CANDIDATES.join("\n")}`
    );
  }

  return found;
}

function main() {
  const chromePath = findChromePath();

  const child = spawn(
    chromePath,
    [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${CDP_PROFILE_DIR}`,
      "https://shopping.naver.com",
    ],
    { detached: true, stdio: "ignore" }
  );

  child.unref();

  console.log(`Chrome를 디버깅 포트 ${CDP_PORT}로 실행했습니다. (전용 프로필: ${CDP_PROFILE_DIR})`);
  console.log("이 창에서 네이버에 로그인해두면 다음 실행부터 로그인 상태가 유지됩니다.");
  console.log("로그인 후 이 창은 그대로 두고, 다른 터미널에서 npm run dev를 실행하세요.");
}

main();
