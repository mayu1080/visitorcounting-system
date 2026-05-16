-- survey_responses: anon からの直接アクセスを禁止（Edge Function の service_role のみ書き込み）
alter table public.survey_responses enable row level security;

drop policy if exists "allow anon insert" on public.survey_responses;
drop policy if exists "allow anon select" on public.survey_responses;
drop policy if exists "allow anon update" on public.survey_responses;
drop policy if exists "allow anon delete" on public.survey_responses;
drop policy if exists "anon can insert responses" on public.survey_responses;

-- anon 向けの INSERT / SELECT / UPDATE / DELETE policy は作らない
