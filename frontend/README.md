# frontend

네이버 쇼핑 광고 수집 결과를 확인하는 관리자 대시보드입니다. React + Vite + Tailwind + Supabase. 사용법은 루트의 [사용설명서.md](../사용설명서.md)를 참고하세요. 이 문서는 구현 방식과 코드 구조를 정리한 기술 문서입니다.

## 페이지

| 경로 | 설명 |
|---|---|
| `/` (대시보드) | 전체 키워드/브랜드 수, 오늘 수집 건수, 최근 수집 시각. "수집 시작" 버튼으로 **로컬에서 실행 중인 크롤러 서버**(`../crawler`)에 수집을 요청할 수 있음 (배포된 사이트에서는 동작하지 않음, 로컬 실행 시에만 동작) |
| `/keywords` (키워드 관리) | 수집할 키워드 등록/삭제/활성화 토글. 활성화(`enabled=true`)된 키워드만 크롤러가 수집 |
| `/results` (수집 결과) | 수집된 광고 상품 목록. 키워드/브랜드/상품명으로 검색 가능 |
| `/brands` (브랜드 관리) | 수집 중 발견된 브랜드(판매처) 목록 |
| `/settings` (설정) | 아직 구현되지 않음 (placeholder) |

## 데이터 흐름

프론트엔드는 별도 API 서버 없이 Supabase(`@supabase/supabase-js`)에 직접 연결합니다.

- `src/lib/supabase.ts` — Supabase 클라이언트 생성
- `src/services/*Service.ts` — 테이블별 조회/변경 함수 (`keywordService`, `brandService`, `collectResultService`, `dashboardService`)
- `src/hooks/*` — 위 서비스를 `@tanstack/react-query`로 감싼 훅

"수집 시작" 버튼은 Supabase가 아니라 **로컬에서 실행 중인 크롤러의 HTTP 서버**(`http://localhost:8787`)를 직접 호출합니다 (`src/services/collectorClient.ts`, `src/hooks/useCollector.ts`). 크롤러 서버가 꺼져있으면 대시보드에 "로컬 수집 서버에 연결할 수 없습니다" 메시지가 뜨고 버튼이 비활성화됩니다.

## 개발

```bash
npm install
npm run dev
```

`.env`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 필요합니다.

## 배포

Vercel에 배포되어 있고, `main` 브랜치 push 시 자동 재배포됩니다.

- Vercel 프로젝트의 **Root Directory는 `frontend`**로 설정되어 있어야 합니다 (모노레포 구조).
- Vercel 프로젝트의 Environment Variables에도 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 등록되어 있어야 합니다.
- `vercel.json`은 React Router(BrowserRouter) 사용 시 새로고침/직접 URL 접근에서 404가 나지 않도록 하는 SPA rewrite 설정입니다.

## 인증

로그인 기능은 제거된 상태입니다. `src/context/AuthContext.tsx`, `src/context/AuthProvider.tsx`, `src/pages/LoginPage.tsx`, `src/components/auth/ProtectedRoute.tsx`는 사용되지 않는 잔존 파일입니다 (각 파일에 삭제해도 무방하다는 주석이 있습니다). 현재는 Supabase `anon` 키로 모든 테이블에 접근합니다 — 관련 배경은 루트 저장소의 `supabase/rls_policies.sql` 참고 (로그인 기능 제거로 전제가 깨진 상태의 미적용 마이그레이션).
