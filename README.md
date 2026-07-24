# 네이버 쇼핑 광고 수집기

네이버 쇼핑에서 특정 키워드로 검색했을 때 노출되는 **광고 상품(브랜드스토어 제외)**을 자동 수집하고, 브랜드 변동 추이를 웹 대시보드로 확인하는 개인 프로젝트입니다. 기획부터 크롤러·대시보드 개발, 배포까지 1인으로 설계·구현했습니다.

**데모** — [naver-shopping-collector.vercel.app](https://naver-shopping-collector.vercel.app) (로그인 없이 조회 가능)

현재 키워드 51개를 대상으로 실행당 약 1,200건의 광고 데이터를 수집하며 운영 중입니다.

---

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| Crawler | Node.js · TypeScript · Playwright (CDP 연결) |
| Frontend | React · TypeScript · Vite · TailwindCSS · TanStack Query · Recharts |
| Database | Supabase (PostgreSQL) · Row Level Security |
| 배포 | Vercel (frontend) · 크롤러는 로컬 전용 |

모노레포 구성: `crawler/` + `frontend/` + `supabase/`

---

## 주요 기능

- **키워드 관리** — 수집 대상 키워드 등록·삭제·활성화 토글
- **자동 수집** — 활성 키워드 전체를 순회하며 광고 상품 수집
- **브랜드 변동 추이** — 회차별 신규 진입/이탈 브랜드 비교, Recharts 시각화
- **데이터 내보내기** — 키워드별 시트로 나뉜 Excel, 브라우저 인쇄 기반 PDF
- **수집 결과 조회** — 실행 회차별 키워드 수집 건수 확인

---

## 기술적 의사결정

### 우회하지 않는 자동화 설계

네이버는 자동화된 접근을 적극적으로 차단합니다. 초기에는 Playwright의 `launch()`로 띄운 브라우저가 자동화 흔적을 남겨 WAF에 차단당했습니다.

차단을 회피하는 기법을 찾는 대신 **접근 구조 자체를 바꿨습니다.**

- 사용자가 직접 실행한 실제 Chrome에 `connectOverCDP`로만 연결
- 캡차는 우회하지 않고, **사람이 직접 풀 시간을 주는 재시도 구조**로 설계
- HTTP 418(IP 쿨다운)은 `HardBlockError`로 즉시 중단

이 선택의 대가로 크롤러는 CI·원격 서버에서 자동 실행할 수 없는 **로컬 전용**이 됐고, 그 제약을 받아들인 아키텍처를 별도로 설계했습니다.

### 로컬 실행 제약을 반영한 아키텍처

브라우저 보안상 웹페이지에서 로컬 프로세스를 띄울 수 없다는 점을 파악하고, 역할을 분리했습니다.

- **배포된 대시보드** → 조회 전담
- **로컬 HTTP 서버**(`127.0.0.1:8787`) → 수집 실행 전담
- 대시보드의 "수집 시작" 버튼은 이미 켜져 있는 로컬 서버를 호출하는 구조

### 공개 읽기 · 로그인 쓰기 (RLS)

데모를 공개하되 데이터는 보호해야 했습니다. Supabase RLS로 `keywords`/`brands`/`collect_results` 전 테이블에 대해 **SELECT는 익명 허용, INSERT·UPDATE·DELETE는 인증 사용자만** 허용했습니다.

프론트엔드는 비로그인 시 삭제·토글 버튼을 숨기지만, 이는 UX 목적일 뿐이고 **실제 차단은 RLS가 담당**합니다. 크롤러도 로그인을 마친 뒤에만 쓰기를 수행합니다.

### PostgREST 1000행 제한 대응

Supabase(PostgREST)는 쿼리당 최대 1000행을 반환합니다. 브랜드 변동·수집 결과 페이지에서 이 한계에 걸려, **키워드별 개별 쿼리를 병렬 실행**하는 방식으로 해결했습니다.

또한 `collect_results` 테이블에 실행(run) 식별자가 없는 데이터 모델의 한계를, **90분 간격 기준으로 run을 추정하는 로직**을 애플리케이션 레벨에 두어 보완했습니다.

---

## 실행 방법

```bash
# 크롤러 — 로컬 전용
cd crawler && npm install
npm run chrome         # 디버깅 Chrome 실행 (최초 1회 네이버 로그인)
npm run dev            # 활성 키워드 전체 1회 수집
npm run server         # 대시보드 버튼용 로컬 HTTP 서버

# 대시보드
cd frontend && npm install && npm run dev
```

환경변수 설정과 최초 세팅은 [사용설명서.md](사용설명서.md)를 참고하세요.

---

## 문서

| 문서 | 내용 |
|---|---|
| [사용설명서.md](사용설명서.md) | 최초 설정과 사용 방법 |
| [crawler/README.md](crawler/README.md) | 수집 로직, 캡차·차단 대응, 설정값 |
| [frontend/README.md](frontend/README.md) | 페이지 구성, 데이터 흐름, 배포 |
| [supabase/README.md](supabase/README.md) | RLS 정책과 계정 생성 |
