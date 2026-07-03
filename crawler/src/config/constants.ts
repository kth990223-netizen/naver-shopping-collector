import path from "node:path";

export const NAVER_SHOPPING_BASE_URL =
  "https://search.shopping.naver.com/search/all";

// 검색 결과 SSR 페이지(__NEXT_DATA__) 기준 실측값. 리스트뷰 기본 페이지당 노출 개수는 40개.
export const MAX_PAGE = 18;

export const PAGE_SIZE = 40;

// 페이지 간 요청 간격(ms). 사람이 검색결과를 넘겨보는 속도에 가깝게 늘리고,
// 매번 똑같은 간격이 되지 않도록 지터를 더한다 (실제 지연 = 이 값 ~ 이 값 + JITTER).
export const REQUEST_DELAY_MS = 4000;
export const REQUEST_DELAY_JITTER_MS = 3000;

export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";

// 수집기 전용으로 Playwright가 새로 실행(launch)하는 브라우저 대신,
// 사용자가 직접 띄운 "진짜" Chrome 프로세스에 CDP로 붙어서 그 브라우저가 페이지를 열게 한다.
// (Playwright의 launch()는 --enable-automation 등 자동화 흔적을 남기지만, CDP 연결만 하면 그런 흔적이 없다.)
// 사용법: `npm run chrome`으로 디버깅용 Chrome을 먼저 띄운 뒤 `npm run dev` 실행.
export const CDP_PORT = 9222;
export const CDP_ENDPOINT = `http://localhost:${CDP_PORT}`;

// npm run chrome이 사용하는 전용 Chrome 프로필 경로. 로그인 세션 쿠키가 담기므로
// 반드시 .gitignore에 포함되어야 한다. (사용자의 평소 크롬 프로필과는 별개)
export const CDP_PROFILE_DIR = path.resolve(__dirname, "../../.naver-cdp-profile");

// 대시보드의 "수집 시작" 버튼이 호출하는 로컬 전용 HTTP 서버.
// 127.0.0.1에만 바인딩되어 외부에서 접근 불가하며, 프론트엔드가 로컬(localhost)로
// 열려있을 때만 CORS로 허용된다 — 배포된 Vercel 사이트에서는 동작하지 않는다.
export const LOCAL_SERVER_PORT = 8787;

export const ALLOWED_DASHBOARD_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5180",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5180",
];

// collect_results는 이보다 오래된 데이터를 매 수집 실행마다 삭제한다.
// (프론트엔드 "브랜드 변동" 페이지는 이 값을 신뢰하고 별도 날짜 필터 없이 전체 조회한다.)
export const RESULT_RETENTION_DAYS = 7;
