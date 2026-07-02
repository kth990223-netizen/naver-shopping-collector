import { chromium } from "playwright";

async function main() {
  console.log("===== NAVER SHOPPING COLLECTOR =====");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
  });

  const context = await browser.newContext({
    viewport: {
      width: 1920,
      height: 1080,
    },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  page.setDefaultTimeout(30000);

  console.log("쇼핑 검색 페이지 이동...");

  await page.goto(
    "https://search.shopping.naver.com/search/all?query=%EB%8B%AD%EA%B0%80%EC%8A%B4%EC%82%B4",
    {
      waitUntil: "domcontentloaded",
    },
  );

  await page.waitForTimeout(5000);

  console.log("제목 :", await page.title());
  console.log("URL :", page.url());

  console.log("엔터를 누르면 종료합니다.");
  process.stdin.resume();

  process.stdin.on("data", async () => {
    await browser.close();
    process.exit(0);
  });
}

main().catch(console.error);
