import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, BrowserContext, Route } from "playwright";
import { createInterface } from "node:readline/promises";
import { BLOCKED_RESOURCE_TYPES, CDP_ENDPOINT } from "../config/constants";
import { buildSearchUrl } from "../utils/url";

/**
 * 418 "일시적 접속 제한"은 사람이 풀 수 있는 캡차가 아니라 IP 쿨다운이라,
 * 재시도/사람 대기가 무의미하다. 이 에러가 던져지면 호출부에서 전체 수집을 중단한다.
 */
export class HardBlockError extends Error {
  constructor(status?: number) {
    super(
      `네이버가 접속을 일시적으로 제한했습니다 (status ${status}). ` +
        `IP 쿨다운으로 보이므로 수집을 중단합니다. 수 시간 뒤 다시 시도해주세요.`
    );
    this.name = "HardBlockError";
  }
}

/**
 * axios(plain HTTP)로는 418(봇 차단)을 계속 받아서 Playwright로 전환했으나,
 * navigator.webdriver 하나만 지우는 걸로는 여전히 418/403이 계속됐다.
 *
 * 원인: package.json에 있던 "playwright-extra-plugin-stealth"는 실제로는
 * 미완성 placeholder 패키지라 아무 패치도 하지 않는다
 * (https://github.com/berstend/puppeteer-extra/issues/454).
 * playwright-extra에 물려서 써야 하는 진짜 stealth 플러그인은
 * puppeteer-extra 생태계의 "puppeteer-extra-plugin-stealth"다.
 *
 * 진단해보니(2026-07-03) 실제로 내려오는 건 단순 헤드리스 탐지가 아니라
 * 네이버 프론트 WAF(nfront)가 명시적으로 발급하는 캡차 챌린지(405)와
 * 그 이후의 "일시적 접속 제한" 차단 페이지(418)였다.
 *
 * launchPersistentContext(로그인 세션 유지)로 바꾼 뒤에도 여전히 차단됐는데,
 * 같은 시점에 같은 네트워크의 일반 브라우저에서는 정상 접속이 됐다 — 즉 IP
 * 차단이 아니라 Playwright가 "실행(launch)"한 브라우저 자체의 자동화 지문
 * (예: --enable-automation 류 플래그) 문제일 가능성이 높다는 뜻이다.
 * 그래서 Playwright가 브라우저를 직접 실행하지 않고, 사용자가 별도로 띄운
 * 진짜 Chrome 프로세스(`npm run chrome`)에 CDP로만 연결하는 방식으로 전환한다.
 */
chromium.use(StealthPlugin());

let browser: Browser | null = null;
let context: BrowserContext | null = null;

async function waitForEnter(message: string): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    await rl.question(message);
  } finally {
    rl.close();
  }
}

/**
 * 로그인 쿠키(NID_AUT) 존재 여부로 로그인 상태를 확인한다.
 * 로그인되어 있지 않으면 로그인 페이지를 열어두고, 사용자가 직접
 * 로그인을 마친 뒤 Enter를 누를 때까지 기다린다.
 */
async function ensureLoggedIn(ctx: BrowserContext): Promise<void> {
  const cookies = await ctx.cookies(["https://www.naver.com"]);

  if (cookies.some((cookie) => cookie.name === "NID_AUT")) {
    return;
  }

  const page = await ctx.newPage();

  try {
    await page.goto("https://nid.naver.com/nidlogin.login", {
      waitUntil: "domcontentloaded",
    });

    await waitForEnter(
      "\n네이버 로그인이 필요합니다. 열린 브라우저 창에서 로그인을 완료한 뒤 Enter를 눌러주세요...\n"
    );
  } finally {
    await page.close();
  }
}

async function getContext(): Promise<BrowserContext> {
  if (context) return context;

  try {
    browser = await chromium.connectOverCDP(CDP_ENDPOINT);
  } catch {
    throw new Error(
      `CDP(${CDP_ENDPOINT})에 연결하지 못했습니다. 먼저 "npm run chrome"으로 디버깅용 Chrome을 띄운 뒤 다시 실행해주세요.`
    );
  }

  // 사용자가 직접 띄운 Chrome의 기본 컨텍스트(로그인 세션 포함)를 그대로 쓴다.
  context = browser.contexts()[0] ?? (await browser.newContext());

  await ensureLoggedIn(context);

  return context;
}

/**
 * CDP 연결과 로그인 상태를 미리 확인한다. 서버(로컬 헬퍼 서버)에서 수집을
 * 시작하기 전에 호출해서, Chrome이 안 떠있으면 페이지마다 재시도하며
 * 시간을 낭비하는 대신 바로 실패하게 한다.
 */
export async function ensureBrowserReady(): Promise<void> {
  await getContext();
}

/**
 * 수집이 끝나면 반드시 호출해서 CDP 연결을 정리한다.
 * CDP로 연결된 browser는 close()를 호출해도 실제 Chrome 프로세스는 종료되지 않고
 * 연결만 끊긴다 (사용자가 띄워둔 브라우저 창은 그대로 남아있다).
 */
export async function closeBrowser(): Promise<void> {
  await browser?.close();
  browser = null;
  context = null;
}

// 418 = "일시적 접속 제한"(하드 블록, 사람이 풀 수 없음)
function isHardBlock(status: number): boolean {
  return status === 418;
}

// 405 또는 본문에 captcha = 사람이 풀 수 있는 캡차 챌린지
function isCaptcha(status: number, body: string): boolean {
  return status === 405 || /captcha/i.test(body);
}

// 이미지/폰트/CSS/미디어를 차단해 페이지 로딩을 가볍게 한다.
// (script/xhr/fetch/document는 통과 — 데이터/캡차 동작에 필요)
function blockResources(route: Route): void {
  if (BLOCKED_RESOURCE_TYPES.includes(route.request().resourceType())) {
    route.abort().catch(() => {});
  } else {
    route.continue().catch(() => {});
  }
}

/**
 * 네이버 쇼핑 검색 결과 페이지의 raw HTML을 가져온다.
 *
 * 이 페이지는 Next.js SSR이라 상품 리스트(광고 포함)가 이미
 * `<script id="__NEXT_DATA__">` 안에 JSON으로 박혀서 내려온다.
 * Playwright는 그 HTML을 얻기 위한 수단일 뿐, 별도 클릭/스크롤 등의
 * 상호작용은 필요 없다 (page.content()만 읽으면 됨).
 *
 * - 이미지/폰트/CSS는 차단해서 로딩을 빠르게 한다.
 * - 405/캡차가 감지되면 리소스 차단을 풀고 페이지를 새로고침해서(그래야 캡차가
 *   제대로 렌더된다) 사용자가 직접 풀 시간을 준 뒤 재시도한다.
 * - 418(일시적 접속 제한)은 사람이 풀 수 없으므로 HardBlockError로 즉시 중단한다.
 */
export async function fetchSearchPageHtml(
  keyword: string,
  pagingIndex: number
): Promise<string> {
  const ctx = await getContext();
  const url = buildSearchUrl(keyword, pagingIndex);

  let lastStatus: number | undefined;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const page = await ctx.newPage();

    try {
      // 이 페이지에만 리소스 차단을 건다 (사용자의 다른 탭에는 영향 없음).
      await page.route("**/*", blockResources);

      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });

      if (response && response.ok()) {
        return await page.content();
      }

      lastStatus = response?.status();
      const bodySnippet = response ? await response.text().catch(() => "") : "";

      if (isHardBlock(lastStatus ?? 0)) {
        throw new HardBlockError(lastStatus);
      }

      if (attempt === 1 && isCaptcha(lastStatus ?? 0, bodySnippet)) {
        console.error(`  [CAPTCHA] status=${lastStatus} — 캡차 페이지로 보입니다.`);

        // 리소스 차단 상태로는 캡차 UI가 깨져서 못 푼다. 차단을 풀고 새로고침해서
        // 이미지/CSS가 정상 로드되게 한 뒤 사용자에게 넘긴다 (둘 다 best-effort).
        await page.unroute("**/*", blockResources).catch(() => {});
        await page
          .reload({ waitUntil: "domcontentloaded", timeout: 20000 })
          .catch(() => {});

        await waitForEnter(
          "  브라우저 창에서 캡차를 직접 풀어주세요. 준비되면 Enter를 눌러 재시도합니다...\n"
        );
      }
    } finally {
      await page.close();
    }
  }

  throw new Error(`요청 실패 (status ${lastStatus})`);
}
