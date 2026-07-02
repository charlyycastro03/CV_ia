create table if not exists cv_master (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  raw_text text,
  structured jsonb,
  updated_at timestamptz default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text not null,
  company text,
  title text,
  location text,
  description text,
  apply_url text,
  raw jsonb,
  fetched_at timestamptz default now(),
  unique(source, external_id)
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id),
  user_id uuid not null default auth.uid(),
  score numeric,
  missing_keywords text[],
  status text default 'pending',
  tailored_cv jsonb,
  cover_letter text,
  created_at timestamptz default now()
);

alter table cv_master enable row level security;
alter table matches enable row level security;
create policy "own_cv" on cv_master for all using (auth.uid() = user_id);
create policy "own_matches" on matches for all using (auth.uid() = user_id);
