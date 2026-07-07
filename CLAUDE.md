# naver-shopping-collector

네이버 쇼핑 광고(브랜드스토어 제외) 수집기. 모노레포: `crawler/` + `frontend/` + Supabase.

사용자 대상 설명은 [사용설명서.md](사용설명서.md), 구현 상세는 각 폴더의 README 참고:
- [crawler/README.md](crawler/README.md) — 수집 로직, 캡차/차단 대응, 설정값, 주요 파일
- [frontend/README.md](frontend/README.md) — 페이지 구성, 데이터 흐름, 1000행 제한 대응, 배포
- [supabase/README.md](supabase/README.md) — RLS 정책(공개 읽기 + 로그인 쓰기)과 계정 생성 방법

## 핵심 아키텍처 (자주 필요한 사실만)

- **crawler는 로컬 전용**. Playwright는 브라우저를 직접 실행하지 않고 사용자가 띄운 진짜 Chrome에 CDP(`connectOverCDP`)로만 연결한다 — `launch()`는 자동화 흔적을 남겨 네이버 WAF 차단의 원인이었음. CI/원격 서버에서 자동 실행 불가.
- **캡차는 우회하지 않는다.** 감지되면 사람이 직접 풀 시간을 주고 재시도하는 구조가 의도된 설계. 418은 IP 쿨다운이라 `HardBlockError`로 즉시 중단.
- **조회는 로그인 없이 누구나, 쓰기는 로그인한 사용자만.** RLS(`supabase/rls_policies.sql`)로 `keywords`/`brands`/`collect_results` 모두 SELECT는 `anon`+`authenticated`, INSERT/UPDATE/DELETE는 `authenticated`만 허용. frontend는 `contexts/AuthContext.tsx` + `pages/LoginPage.tsx`로 이메일/비밀번호 로그인을 제공하고, 로그인 안 하면 키워드 추가/삭제/토글(`KeywordPage`)과 "오래된 데이터 삭제"(`DashboardPage`) 버튼이 숨겨진다(RLS가 이중으로 막아주므로 UI는 UX용). crawler도 `lib/supabase.ts`의 `supabaseReady`로 시작 시 `SUPABASE_EMAIL`/`SUPABASE_PASSWORD` 로그인을 마친 뒤에만 `brands`/`collect_results`에 쓴다.
- **계정 생성은 Supabase 대시보드 UI 대신 `crawler/scripts/create-users.mjs`로 로컬에서 한다** (`npm run create-users`). service_role 키는 스크립트 실행 중 터미널 입력으로만 쓰고 저장하지 않음. 본인 계정과 친구 배포용 계정을 따로 만들어 문제 생기면 개별 계정만 정지할 수 있게 함.
- **"수집 시작" 버튼을 만들 수 없는 건 서버(`npm run server`) 자체이지 크롤러 실행이 아님** — 로컬 서버가 켜져있어야 대시보드 버튼이 그 서버를 호출하는 구조. 서버 실행은 `start-server.bat`/터미널로 브라우저 밖에서 해야 함.
- Supabase(PostgREST) 1000행 제한 때문에 브랜드 변동/수집 결과 페이지는 키워드별 개별 쿼리 병렬 실행 (`brandChangeService.getKeywordHistories`). `collect_results`에 실행(run) 식별자가 없어 90분 간격으로 run을 추정(`runSummary.ts`).

## 파일 구조

```
crawler/src/
  index.ts               — 진입점
  collectAll.ts           — 활성 키워드 전체 수집 오케스트레이션 (npm run dev). 맨 앞에서 supabaseReady await
  server.ts                — 대시보드 버튼용 로컬 HTTP 서버 (npm run server)
  scripts/launchChrome.ts  — 디버깅 Chrome 실행 (npm run chrome)
  services/
    searchPageClient.ts    — CDP로 붙은 Chrome에서 네이버 검색 페이지 조작
    collectorService.ts    — 수집 실행 흐름
    keywordService.ts / brandService.ts / resultService.ts — Supabase CRUD
  parser/shoppingParser.ts — 검색결과 HTML → 광고 데이터 파싱
  lib/supabase.ts          — Supabase 클라이언트 + supabaseReady(이메일/비밀번호 로그인 promise)
  config/constants.ts, types/ad.ts, types/keyword.ts, utils/url.ts
crawler/scripts/create-users.mjs — Supabase Auth 계정 로컬 생성 스크립트 (npm run create-users)

frontend/src/
  pages/       — DashboardPage, KeywordPage, BrandPage, BrandChangePage, ResultPage, CollectPage, SettingPage, LoginPage
  contexts/AuthContext.tsx — Supabase Auth 세션 상태(useAuth: user/loading/signIn/signOut)
  hooks/       — useKeywords, useBrands, useKeywordHistories, useCollector, useDashboardStats, useCleanupOldResults
  services/    — keywordService, brandService, brandChangeService, collectResultService, collectorClient(로컬 서버 호출), cleanupService, dashboardService
  components/  — keyword/, brand/, layout/Sidebar(로그인 상태 표시), common/Modal
  layouts/AdminLayout.tsx
  utils/runSummary.ts     — 90분 간격으로 collect_results run 추정
  utils/exportBrandChanges.ts

supabase/
  rls_policies.sql — 적용 필요 마이그레이션. 대시보드 SQL Editor에서 실행해야 함 (공개 읽기 + 로그인 쓰기)
```

## 자주 쓰는 명령

```bash
cd crawler && npm run chrome         # 디버깅 Chrome 실행 (최초 로그인)
cd crawler && npm run dev            # 활성 키워드 전체 1회 수집
cd crawler && npm run server         # 대시보드 버튼용 로컬 HTTP 서버 (127.0.0.1:8787)
cd crawler && npm run create-users   # Supabase Auth 계정 로컬 생성 (service_role 키 필요, 저장 안 됨)
cd frontend && npm run dev           # 대시보드 로컬 실행
```

프론트엔드는 Vercel에 배포(`main` push 시 자동 재배포, Root Directory=`frontend`). 크롤러는 배포되지 않음.
