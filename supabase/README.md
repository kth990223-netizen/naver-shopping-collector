# Supabase 설정

`rls_policies.sql`을 Supabase 대시보드 > SQL Editor에서 실행하면 세 테이블(`keywords`,
`brands`, `collect_results`)에 RLS가 걸립니다.

- **조회(SELECT)는 로그인 없이 누구나 가능**합니다 — 배포된 대시보드는 계속 공개 데모로 동작합니다.
- **추가/수정/삭제는 로그인한 사용자(authenticated)만** 가능합니다. frontend는 Supabase Auth
  이메일/비밀번호 로그인을 붙여 두었고, crawler도 실행 시 로그인한 뒤에만 씁니다.

## 계정 생성

Supabase 대시보드의 Authentication 화면 대신, 로컬에서 `crawler/scripts/create-users.mjs`
스크립트로 계정을 만듭니다. 이 스크립트는 실행할 때 `service_role` 키와 이메일/비밀번호를
터미널에서 직접 입력받고 어디에도 저장하지 않습니다. 자세한 사용법은 스크립트 상단 주석 참고.

`service_role` 키는 Supabase 대시보드 > Settings > API에서 한 번 확인해야 합니다(API 자체가
그 키를 생성하는 곳이라 이 단계는 생략할 수 없습니다). 계정 생성이 끝나면 그 키는 다시 쓸 일이
없으니 따로 저장하지 않아도 됩니다.

## 계정별 역할

- **본인 계정**: frontend 배포 사이트(`/login`)에 로그인해서 키워드 추가/삭제, 오래된 데이터
  삭제 등 관리 작업을 할 때 사용.
- **친구 계정**: 친구가 로컬에서 crawler를 돌릴 때 `crawler/.env`의
  `SUPABASE_EMAIL`/`SUPABASE_PASSWORD`로 로그인해서 수집 결과를 쓸 때 사용. 문제가 생기면
  이 계정만 비밀번호를 바꾸거나 비활성화하면 됩니다.
