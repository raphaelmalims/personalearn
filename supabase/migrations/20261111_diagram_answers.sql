-- PSL-27: per-part right/wrong tally for the labelled-diagram spike.

create table public.diagram_answers (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  grade integer not null,
  language text not null,
  part_id text not null,
  mode text not null check (mode in ('find', 'name')),
  correct boolean not null,
  created_at timestamptz not null default now()
);

create index diagram_answers_topic_grade_language
  on public.diagram_answers (topic, grade, language);

alter table public.diagram_answers enable row level security;

create policy "Signed-in teachers can read diagram answers"
  on public.diagram_answers
  for select
  to authenticated
  using (auth.uid() is not null);

create policy "Signed-in teachers can insert diagram answers"
  on public.diagram_answers
  for insert
  to authenticated
  with check (auth.uid() is not null);
