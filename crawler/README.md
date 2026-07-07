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
cp .env.example .env   # SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_EMAIL, SUPABASE_PASSWORD 채우기
npm run chrome          # 디버깅용 Chrome 실행, 최초 1회 로그인
npm run dev              # 활성 키워드 전체를 1회 수집하고 종료
# 또는
npm run server            # 대시보드 "수집 시작" 버튼이 호출하는 로컬 HTTP 서버로 실행
```

`brands`/`collect_results`는 RLS로 로그인한 사용자만 쓸 수 있어서, `SUPABASE_EMAIL`/`SUPABASE_PASSWORD`가 없으면 수집 자체가 실패합니다(`src/lib/supabase.ts`가 시작 시 로그인). 계정이 없다면 `npm run create-users`로 만드세요 (아래 참고).

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run chrome` | 디버깅 포트(9222)를 연 Chrome 실행. 전용 프로필(`.naver-cdp-profile/`)에 로그인 세션 저장 |
| `npm run dev` | 활성화된 키워드를 모두 수집하고 종료 (CLI 1회 실행) |
| `npm run server` | `127.0.0.1:8787`에서 `POST /collect`, `GET /status`, `POST /shutdown`을 제공하는 로컬 서버. `/collect`는 서버 프로세스 안에서 조용히 수집하는 대신 **새 cmd 창을 띄워 그 안에서 `npm run chrome` → `npm run dev`를 순서대로 실행**한다 (캡차 대응/로그를 그 창에서 바로 확인 가능, 미리 Chrome을 띄워둘 필요 없음). `/shutdown`은 대시보드의 "로컬 서버 종료" 버튼이 호출하며, 수집 진행 중에는 거부한다. Windows 전용(`cmd.exe`/`start` 사용) |
| `start-server.bat` | `npm run server`를 더블클릭만으로 실행하는 launcher. 대시보드에는 서버를 "시작"하는 버튼을 만들 수 없다 (아래 참고) |
| `npm run create-users` | Supabase Auth 계정을 대시보드 UI 없이 로컬에서 생성하는 1회성 스크립트(`scripts/create-users.mjs`). service_role 키를 실행 중 터미널로만 입력받고 저장하지 않는다. 자세한 내용은 [../supabase/README.md](../supabase/README.md) 참고 |

## 수집 로직

1. Supabase `keywords` 테이블에서 `enabled=true`인 키워드를 조회 (진행 상황은 `[순번/전체]`로 로그에 표시)
2. 키워드마다 1~`MAX_PAGE`(기본 16) 페이지를 순회하며 검색결과 HTML을 가져옴 (이미지/폰트/CSS는 차단해 로딩을 가볍게 함)
3. 각 페이지의 `__NEXT_DATA__` JSON에서 상품 목록을 파싱하고, `adId`가 있고 `isBrandStore`가 아닌 상품만 필터링
4. **조기 종료**: "정상 파싱된 광고 0개" 페이지가 `EARLY_STOP_NO_AD_PAGES`(기본 2)회 연속이면 남은 페이지를 건너뛰고 종료. 광고가 있는 페이지를 만나면 카운터 리셋, 수집 실패한 페이지(캡차/네트워크/구조변경)는 판정에서 제외(중립)
5. 결과를 Supabase `collect_results`에 누적 저장(같은 키워드를 다시 수집해도 기존 결과는 지우지 않음), 등장한 브랜드(몰)명을 `brands` 테이블에 upsert(`first_seen`/`last_seen` 관리)
   - **광고가 0건이어도** `brand_name=null` 마커 1행을 저장한다. 이렇게 해야 "0건 수집"과 "아예 미수집"이 구분되고, 프론트 브랜드 변동 페이지에서 이전 브랜드가 전부 이탈(→0)한 것으로 보인다. (`saveResults(keyword, ads)` 시그니처)
6. 수집이 끝나면 cmd 창에 **수집 요약**을 출력한다 — 수집 시작/종료 시각, 키워드별 수집건수(`console.table`), 총 수집건수.

**차단 대응**: 405/캡차 페이지가 감지되면 리소스 차단을 풀고 페이지를 새로고침한 뒤(그래야 캡차가 제대로 렌더됨) 사용자가 직접 풀 시간을 주고 재시도한다. 418(일시적 접속 제한)은 사람이 풀 수 없는 IP 쿨다운이라 `HardBlockError`로 전체 수집을 즉시 중단한다.

크롤러는 수집만 담당하고, 오래된 데이터 삭제는 하지 않는다 (별도 프로그램에서 처리 예정). `src/services/resultService.ts`의 `deleteOldResults()`는 `RESULT_RETENTION_DAYS`(기본 7일)보다 오래된 `collect_results` 행을 지우는 함수로, 크롤러 수집 흐름에는 연결되어 있지 않고 별도 정리 프로그램에서 재사용할 수 있도록 남겨둔 상태다.

## 주요 파일

- `src/collectAll.ts` — 활성 키워드 전체 순회 수집 로직 (`index.ts`, `server.ts` 공용)
- `src/index.ts` — CLI 진입점 (`npm run dev`)
- `src/server.ts` — 로컬 HTTP 서버 (`npm run server`), 대시보드 버튼이 호출
- `src/scripts/launchChrome.ts` — `npm run chrome`이 실행하는 스크립트
- `src/services/searchPageClient.ts` — CDP 연결, 로그인 확인, 리소스 차단, 캡차 감지/해제·새로고침·재시도, 418 하드 블록(`HardBlockError`)
- `src/services/collectorService.ts` — 키워드 하나에 대한 페이지 순회 + 지연 + 조기 종료 + 진행 표시
- `src/parser/shoppingParser.ts` — 검색결과 HTML의 `__NEXT_DATA__`에서 상품 목록 파싱
- `src/services/keywordService.ts` — Supabase에서 활성 키워드 조회
- `src/services/resultService.ts` — 수집 결과를 `collect_results`에 저장(0건이면 `brand_name=null` 마커 저장), `deleteOldResults()`
- `src/services/brandService.ts` — 발견된 브랜드를 `brands`에 upsert
- `src/config/constants.ts` — 페이지 수, 지연 시간, CDP/서버 포트 등 설정값

## 설정값 (`src/config/constants.ts`)

- `MAX_PAGE` — 키워드당 확인할 최대 페이지 수 (기본 16, 조기 종료로 보통 더 일찍 끝남)
- `EARLY_STOP_NO_AD_PAGES` — 정상 파싱된 광고 0개 페이지가 이만큼 연속되면 조기 종료 (기본 2)
- `BLOCKED_RESOURCE_TYPES` — 로딩 차단할 리소스 타입 (image/font/stylesheet/media)
- `REQUEST_DELAY_MS` / `REQUEST_DELAY_JITTER_MS` — 페이지/키워드 사이 지연(기본 4~7초)
- `CDP_PORT` / `CDP_ENDPOINT` — Chrome 디버깅 연결 정보
- `CDP_PROFILE_DIR` — 로그인 세션이 저장되는 전용 Chrome 프로필 경로 (`.gitignore` 처리됨)
- `LOCAL_SERVER_PORT` / `ALLOWED_DASHBOARD_ORIGINS` — 로컬 서버 포트와 CORS 허용 origin (로컬 개발 포트만 허용, 배포된 사이트는 차단됨)
- `RESULT_RETENTION_DAYS` — `collect_results` 보관 기간(기본 7일). 매 수집 실행마다 이보다 오래된 행을 삭제

## 알려진 이슈

- `server.ts`의 `/collect`는 `cmd /c start /wait ... cmd /c "npm run chrome && timeout /t 3 /nobreak >nul && npm run dev && pause"` 형태로 새 창을 띄운다. `npm run chrome`은 백그라운드로 Chrome을 띄우고 바로 반환되므로 CDP 포트가 열릴 시간을 벌기 위해 3초 지연을 둔다 — 만약 Chrome이 3초 안에 뜨지 못하는 느린 환경이라면 `npm run dev`의 `ensureBrowserReady()`가 실패할 수 있으니 지연 시간을 늘려야 할 수 있다. `start /wait`가 그 창이 닫힐 때까지 기다려서 `running` 상태를 추적하는 구조라, 사용자가 수집이 끝난 뒤 `pause` 프롬프트에서 아무 키나 누르기 전까지는 대시보드에 계속 "수집 중"으로 표시된다 (의도된 동작). Windows `cmd.exe` 문법에 의존하므로 다른 OS에서는 동작하지 않는다.
- **로컬 서버(`npm run server`)를 "시작"하는 프론트엔드 버튼은 만들 수 없다.** "수집 시작"/"로컬 서버 종료" 버튼은 이미 떠있는 로컬 서버에게 브라우저가 요청을 보내는 구조라 동작하지만, 서버가 꺼져있으면 요청을 받아줄 대상 자체가 없다. 브라우저는 웹페이지가 로컬 프로그램을 직접 실행하는 것을 허용하지 않으므로(보안상 당연한 제약), 서버 실행은 `start-server.bat` 더블클릭이나 터미널 명령으로 브라우저 바깥에서 해야 한다.
