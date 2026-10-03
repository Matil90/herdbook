-- HerdBook database setup. Paste into Supabase -> SQL Editor -> Run.

-- Daily usage counters for the AI photo analysis (keeps the API bill under control).
-- Only the Edge Function (service role) touches this table; row level security with
-- no policies blocks everyone else.
create table if not exists public.ai_usage (
  key   text not null,
  day   date not null default current_date,
  count int  not null default 0,
  primary key (key, day)
);
alter table public.ai_usage enable row level security;

-- Adds one use for today and returns true while the count is within p_limit.
create or replace function public.ai_usage_hit(p_key text, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  c int;
begin
  insert into ai_usage (key, day, count) values (p_key, current_date, 1)
  on conflict (key, day) do update set count = ai_usage.count + 1
  returning count into c;
  return c <= p_limit;
end;
$$;

revoke all on function public.ai_usage_hit(text, int) from public, anon, authenticated;
