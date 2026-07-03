# crawler

네이버 쇼핑 검색결과에서 "광고 중인 상품(브랜드스토어 제외)"을 수집해 Supabase에 저장하는 Node.js 프로그램입니다. 사용법은 루트의 [사용설명서.md](../사용설명서.md)를 참고하세요. 이 문서는 구현 방식과 코드 구조를 정리한 기술 문서입니다.

## 왜 이렇게 만들어졌는지

네이버 쇼핑은 자동화된 요청을 적극적으로 차단합니다(WAF 캡차, 접속 제한 등). 여러 차례 시행착오 끝에 다음 구조로 정착했습니다.

- Playwright가 브라우저를 직접 실행(`launch`)하지 않고, **사용자가 직접 띄운 진짜 Chrome**에 CDP(`connectOverCDP`)로만 연결합니다. Playwright의 `launch()`는 자동화 흔적(`--enable-automation` 등)을 남겨서 실제 차단 원인이었습니다.
- 로그인 세션을 전용 Chrome 프로필(`.naver-cdp-profile/`)에 유지해서, 매번 익명 세션으로 접근하지 않습니다.
- 페이지/키워드 사이에 사람 수준의 지연(4~7초 랜덤)을 둡니다.
- 캡차가 감지되면 자동으로 풀려고 시도하지 않고, 사람이 직접 풀 시간을 주고 재시도합니다.

이 배경 때문에 크롤러는 **CI나 원격 서버에서 자동 실행할 수 없고, 사람이 로그인/캡차를 처리할 수 있는 로컬 컴퓨터에서만 실행**하도록 설계되어 있습니다.

## 사용 방법

```bash
npm install
cp .env.example .env   # SUPABASE_URL, SUPABASE_ANON_KEY 채우기
npm run chrome          # 디버깅용 Chrome 실행, 최초 1회 로그인
npm run dev              # 활성 키워드 전체를 1회 수집하고 종료
# 또는
npm run server            # 대시보드 "수집 시작" 버튼이 호출하는 로컬 HTTP 서버로 실행
```

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run chrome` | 디버깅 포트(9222)를 연 Chrome 실행. 전용 프로필(`.naver-cdp-profile/`)에 로그인 세션 저장 |
| `npm run dev` | 활성화된 키워드를 모두 수집하고 종료 (CLI 1회 실행) |
| `npm run server` | `127.0.0.1:8787`에서 `POST /collect`, `GET /status`를 제공하는 로컬 서버 |

## 수집 로직

1. Supabase `keywords` 테이블에서 `enabled=true`인 키워드를 조회
2. 키워드마다 1~`MAX_PAGE`(기본 18) 페이지를 순회하며 검색결과 HTML을 가져옴
3. 각 페이지의 `__NEXT_DATA__` JSON에서 상품 목록을 파싱하고, `adId`가 있고 `isBrandStore`가 아닌 상품만 필터링
4. 결과를 Supabase `collect_results`에 누적 저장(같은 키워드를 다시 수집해도 기존 결과는 지우지 않음), 등장한 브랜드(몰)명을 `brands` 테이블에 upsert(`first_seen`/`last_seen` 관리)

## 주요 파일

- `src/collectAll.ts` — 활성 키워드 전체 순회 수집 로직 (`index.ts`, `server.ts` 공용)
- `src/index.ts` — CLI 진입점 (`npm run dev`)
- `src/server.ts` — 로컬 HTTP 서버 (`npm run server`), 대시보드 버튼이 호출
- `src/scripts/launchChrome.ts` — `npm run chrome`이 실행하는 스크립트
- `src/services/searchPageClient.ts` — CDP 연결, 로그인 확인, 캡차 감지/재시도
- `src/services/collectorService.ts` — 키워드 하나에 대한 페이지 순회 + 지연
- `src/parser/shoppingParser.ts` — 검색결과 HTML의 `__NEXT_DATA__`에서 상품 목록 파싱
- `src/services/keywordService.ts` — Supabase에서 활성 키워드 조회
- `src/services/resultService.ts` — 수집 결과를 `collect_results`에 저장
- `src/services/brandService.ts` — 발견된 브랜드를 `brands`에 upsert
- `src/config/constants.ts` — 페이지 수, 지연 시간, CDP/서버 포트 등 설정값

## 설정값 (`src/config/constants.ts`)

- `MAX_PAGE` — 키워드당 확인할 페이지 수 (기본 18)
- `REQUEST_DELAY_MS` / `REQUEST_DELAY_JITTER_MS` — 페이지/키워드 사이 지연(기본 4~7초)
- `CDP_PORT` / `CDP_ENDPOINT` — Chrome 디버깅 연결 정보
- `CDP_PROFILE_DIR` — 로그인 세션이 저장되는 전용 Chrome 프로필 경로 (`.gitignore` 처리됨)
- `LOCAL_SERVER_PORT` / `ALLOWED_DASHBOARD_ORIGINS` — 로컬 서버 포트와 CORS 허용 origin (로컬 개발 포트만 허용, 배포된 사이트는 차단됨)

## 알려진 이슈

- `src/services/graphqlClient.ts`는 초기 구현(SSR 페이지 파싱 방식으로 전환하기 전) 방식의 죽은 코드입니다. 현재 `Ad` 타입과 필드가 맞지 않아 `npx tsc --noEmit` 시 이 파일만 타입 에러가 납니다. 삭제 예정.
