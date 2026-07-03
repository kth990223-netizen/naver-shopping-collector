# Supabase 설정

로그인 기능은 제거했습니다. 그래서 이 폴더의 `rls_policies.sql`은 지금은 적용하지 않아도 됩니다
(로그인이 없는데 RLS로 `authenticated`만 허용하면 아무도 못 씁니다).

참고로 지금 구조에서는 anon key로 `keywords`/`brands`/`collect_results`를 누구나 읽고 쓸 수 있는
상태입니다. 나중에 접근 제한이 필요해지면 이 폴더의 SQL을 다시 꺼내 쓰시면 됩니다.
