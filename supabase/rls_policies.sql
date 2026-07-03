-- Supabase RLS 설정: 관리자 페이지에 로그인 없이도 anon key로
-- keywords / brands / collect_results 테이블을 읽고 쓸 수 있던 문제를 막습니다.
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 그대로 실행하세요.
--
-- 전제:
--   - 프론트엔드는 로그인한 사용자(authenticated role)만 이 테이블들에
--     접근하도록 바뀌었습니다 (Supabase Auth 이메일/비밀번호 로그인).
--   - crawler(수집기)는 현재 Supabase에 직접 쓰지 않는 상태입니다.
--     추후 crawler가 결과를 저장하게 되면, service_role key를 사용하거나
--     "service" 전용 policy를 별도로 추가해야 합니다. service_role key는
--     RLS를 우회하므로 별도 정책 없이도 동작합니다.

alter table public.keywords enable row level security;
alter table public.brands enable row level security;
alter table public.collect_results enable row level security;

-- keywords: 로그인한 사용자만 조회/추가/수정/삭제 가능
drop policy if exists "authenticated_select_keywords" on public.keywords;
create policy "authenticated_select_keywords"
  on public.keywords for select
  to authenticated
  using (true);

drop policy if exists "authenticated_insert_keywords" on public.keywords;
create policy "authenticated_insert_keywords"
  on public.keywords for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated_update_keywords" on public.keywords;
create policy "authenticated_update_keywords"
  on public.keywords for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated_delete_keywords" on public.keywords;
create policy "authenticated_delete_keywords"
  on public.keywords for delete
  to authenticated
  using (true);

-- brands: 로그인한 사용자만 조회 가능 (프론트에서 쓰기는 하지 않음)
drop policy if exists "authenticated_select_brands" on public.brands;
create policy "authenticated_select_brands"
  on public.brands for select
  to authenticated
  using (true);

-- collect_results: 로그인한 사용자만 조회 가능 (프론트에서 쓰기는 하지 않음)
drop policy if exists "authenticated_select_collect_results" on public.collect_results;
create policy "authenticated_select_collect_results"
  on public.collect_results for select
  to authenticated
  using (true);

-- 참고: anon role에 대한 policy를 만들지 않으면 RLS가 켜진 상태에서
-- anon key로는 아무 것도 조회/변경할 수 없습니다 (기본 거부).
