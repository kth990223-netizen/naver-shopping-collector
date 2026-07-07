-- Supabase RLS 설정: 조회는 누구나(로그인 없이) 가능하게 두고,
-- 데이터를 바꾸는 작업(추가/수정/삭제)만 로그인한 사용자(authenticated)로 제한합니다.
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 그대로 실행하세요.
--
-- 전제:
--   - 배포된 대시보드는 로그인 없이 누구나 조회 가능해야 합니다 (포트폴리오 데모 링크로 공개됨).
--   - 키워드 추가/삭제, 오래된 데이터 삭제 등 쓰기 작업은 로그인한 사용자만 가능합니다
--     (frontend에 Supabase Auth 이메일/비밀번호 로그인 추가, scripts/create-users.mjs로 계정 생성).
--   - crawler(수집기)도 이제 로그인(로컬 .env의 SUPABASE_EMAIL/PASSWORD)한 뒤에만
--     brands/collect_results에 쓸 수 있습니다 (crawler/src/lib/supabase.ts 참고).

alter table public.keywords enable row level security;
alter table public.brands enable row level security;
alter table public.collect_results enable row level security;

-- ── keywords ─────────────────────────────────────────────
-- 조회: 누구나(anon 포함) 가능
drop policy if exists "authenticated_select_keywords" on public.keywords;
drop policy if exists "public_select_keywords" on public.keywords;
create policy "public_select_keywords"
  on public.keywords for select
  to anon, authenticated
  using (true);

-- 추가/수정/삭제: 로그인한 사용자만
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

-- ── brands ───────────────────────────────────────────────
-- 조회: 누구나 가능. 쓰기: crawler가 로그인한 뒤 upsert.
drop policy if exists "authenticated_select_brands" on public.brands;
drop policy if exists "public_select_brands" on public.brands;
create policy "public_select_brands"
  on public.brands for select
  to anon, authenticated
  using (true);

drop policy if exists "authenticated_insert_brands" on public.brands;
create policy "authenticated_insert_brands"
  on public.brands for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated_update_brands" on public.brands;
create policy "authenticated_update_brands"
  on public.brands for update
  to authenticated
  using (true)
  with check (true);

-- ── collect_results ──────────────────────────────────────
-- 조회: 누구나 가능. 쓰기: crawler가 저장(insert), 프론트 "오래된 데이터 삭제"가 delete.
drop policy if exists "authenticated_select_collect_results" on public.collect_results;
drop policy if exists "public_select_collect_results" on public.collect_results;
create policy "public_select_collect_results"
  on public.collect_results for select
  to anon, authenticated
  using (true);

drop policy if exists "authenticated_insert_collect_results" on public.collect_results;
create policy "authenticated_insert_collect_results"
  on public.collect_results for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated_delete_collect_results" on public.collect_results;
create policy "authenticated_delete_collect_results"
  on public.collect_results for delete
  to authenticated
  using (true);

-- 참고: anon/authenticated 어느 쪽에도 policy가 없는 작업(예: anon의 insert/update/delete)은
-- RLS가 켜진 상태에서 기본적으로 거부됩니다.
