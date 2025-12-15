create extension if not exists "pgcrypto";

-- Enums (veilig aanmaken)
do $$ begin
  create type priority_level as enum ('low','medium','high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type question_status as enum ('active','inactive','archived');
exception when duplicate_object then null; end $$;

-- Updated_at trigger function (replace is safe)
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Questions table (maak of laat bestaan)
create table if not exists public.questions (
  id bigserial primary key,
  uuid uuid not null unique default gen_random_uuid(),
  title varchar(500) not null,
  description text,
  category varchar(100),
  priority priority_level not null default 'medium',
  status question_status not null default 'active',
  mode varchar(50) not null default 'regular',
  created_by varchar(255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for questions (maak indexes die niet afhankelijk zijn van conditionele kolommen)
create index if not exists idx_questions_uuid
  on public.questions (uuid);

create index if not exists idx_questions_category
  on public.questions (category);

create index if not exists idx_questions_status
  on public.questions (status);

create index if not exists idx_questions_priority
  on public.questions (priority);

create index if not exists idx_questions_created_at
  on public.questions (created_at);

-- Maak/refresh trigger (drop+create is safe)
drop trigger if exists set_timestamp on public.questions;
create trigger set_timestamp
before update on public.questions
for each row execute procedure set_updated_at();

-- Veilige migratie: als de kolom `mode` nog niet bestaat, voeg toe en maak index.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'questions'
      and column_name = 'mode'
  ) then
    alter table public.questions
      add column mode varchar(50) not null default 'regular';
  end if;

  -- Maak de index alleen als de kolom bestaat (dit voorkomt errors bij vage migratie-states)
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'questions'
      and column_name = 'mode'
  ) then
    execute 'create index if not exists idx_questions_mode on public.questions (mode)';
  end if;
end $$;


-- Responses table
create table if not exists public.responses (
  uuid uuid primary key default gen_random_uuid(),
  question_uuid uuid not null references public.questions(uuid) on delete cascade,
  response_data jsonb not null,
  user_identifier text,
  submission_uuid uuid
);

-- MIGRATIE: voeg submission_uuid toe als kolom mist (idempotent)
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'responses'
      and column_name = 'submission_uuid'
  ) then
    alter table public.responses add column submission_uuid uuid;
  end if;
end $$;

-- MIGRATIE: verwijder created_at als die per ongeluk bestaat
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'responses'
      and column_name = 'created_at'
  ) then
    drop index if exists responses_created_at_idx;
    alter table public.responses drop column created_at;
  end if;
end $$;

-- Indexen voor responses
create index if not exists responses_question_uuid_idx on public.responses (question_uuid);
create index if not exists idx_responses_submission_uuid on public.responses (submission_uuid);