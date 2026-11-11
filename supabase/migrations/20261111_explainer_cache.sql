-- PSL-28: shared explainer scripts that survive a serverless restart.
-- cache_key is topic|grade|language, or that key plus a personal-layer digest.

create table public.explainer_cache (
  cache_key text primary key,
  script jsonb not null,
  model_id text not null,
  created_at timestamptz not null default now()
);

alter table public.explainer_cache enable row level security;

create policy "Signed-in teachers can read explainer cache"
  on public.explainer_cache
  for select
  to authenticated
  using (auth.uid() is not null);

create policy "Signed-in teachers can insert explainer cache"
  on public.explainer_cache
  for insert
  to authenticated
  with check (auth.uid() is not null);

create policy "Signed-in teachers can update explainer cache"
  on public.explainer_cache
  for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
