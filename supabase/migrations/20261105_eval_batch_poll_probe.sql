-- Idle eval polls must reach Postgres. The Vercel service-role key on
-- production is rejected (UNAUTHORIZED_INVALID_API_KEY) before the query
-- runs, so the free project never sees activity and pauses.
-- This probe is the pending-job read plus `select 1`, callable with the
-- project publishable key. It returns a count only.

create or replace function public.eval_batch_poll_probe()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  alive int;
  pending int;
begin
  select 1 into alive;
  select count(*)::int into pending
  from public.gemini_batch_jobs
  where state in ('submitted', 'running');
  return jsonb_build_object(
    'keep_alive', alive,
    'query', 'select 1; select count(*) from gemini_batch_jobs where state in (submitted, running)',
    'pending', pending
  );
end;
$$;

revoke all on function public.eval_batch_poll_probe() from public;
grant execute on function public.eval_batch_poll_probe() to anon, authenticated, service_role;
