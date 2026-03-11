-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- SCRIPTS
-- ============================================================
create table public.scripts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- Scripts are public read-only
alter table public.scripts enable row level security;

create policy "Scripts are publicly readable"
  on public.scripts for select
  using (true);


-- ============================================================
-- CHARACTERS
-- ============================================================
create table public.characters (
  id          uuid primary key default gen_random_uuid(),
  script_id   uuid not null references public.scripts(id) on delete cascade,
  character   text not null,
  label       text not null,           -- e.g. "Uppercase A", "Lowercase a"
  letter_case text check (letter_case in ('upper', 'lower', 'numeral', 'symbol')),
  difficulty  int  not null default 1 check (difficulty between 1 and 3),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (script_id, character)
);

alter table public.characters enable row level security;

create policy "Characters are publicly readable"
  on public.characters for select
  using (true);


-- ============================================================
-- PRACTICE SESSIONS
-- ============================================================
create table public.practice_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  script_id  uuid not null references public.scripts(id),
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  notes      text,
  created_at timestamptz not null default now()
);

alter table public.practice_sessions enable row level security;

create policy "Users can manage their own sessions"
  on public.practice_sessions for all
  using (auth.uid() = user_id);


-- ============================================================
-- PRACTICE ATTEMPTS
-- ============================================================
create table public.practice_attempts (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.practice_sessions(id) on delete cascade,
  character_id uuid not null references public.characters(id),
  score        int  not null check (score between 1 and 5),
  created_at   timestamptz not null default now()
);

alter table public.practice_attempts enable row level security;

create policy "Users can manage their own attempts"
  on public.practice_attempts for all
  using (
    auth.uid() = (
      select user_id from public.practice_sessions where id = session_id
    )
  );


-- ============================================================
-- USER PROGRESS  (upserted after each attempt)
-- ============================================================
create table public.user_progress (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  character_id      uuid not null references public.characters(id) on delete cascade,
  best_score        int  not null default 0 check (best_score between 0 and 5),
  attempt_count     int  not null default 0,
  last_practiced_at timestamptz,
  created_at        timestamptz not null default now(),
  unique (user_id, character_id)
);

alter table public.user_progress enable row level security;

create policy "Users can manage their own progress"
  on public.user_progress for all
  using (auth.uid() = user_id);


-- ============================================================
-- SEED: SCRIPTS
-- ============================================================
insert into public.scripts (id, name, description) values
  ('11111111-0000-0000-0000-000000000001', 'Copperplate',  'Oval-based pointed-pen script with thick downstrokes and thin upstrokes'),
  ('11111111-0000-0000-0000-000000000002', 'Spencerian',   'Lighter pointed-pen script with fine hairlines, popular in 19th-century America'),
  ('11111111-0000-0000-0000-000000000003', 'Italic',       'Broad-nib script with slight right slant and compressed letterforms'),
  ('11111111-0000-0000-0000-000000000004', 'Gothic/Blackletter', 'Dense broad-nib script with angular strokes and diamond serifs');


-- ============================================================
-- SEED: CHARACTERS (shared across all scripts — uppercase + lowercase alphabet)
-- ============================================================
do $$
declare
  script_ids uuid[] := array[
    '11111111-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000004'
  ];
  sid uuid;
  i int;
  ch text;
  upper_chars text[] := array['A','B','C','D','E','F','G','H','I','J','K','L','M',
                               'N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  lower_chars text[] := array['a','b','c','d','e','f','g','h','i','j','k','l','m',
                               'n','o','p','q','r','s','t','u','v','w','x','y','z'];
  -- Rough difficulty: 1=easy, 2=medium, 3=hard
  upper_diff  int[]  := array[2,2,2,1,2,2,2,2,1,2,2,1,2,1,2,2,2,1,1,1,1,1,2,2,2,2];
  lower_diff  int[]  := array[1,2,1,1,1,2,2,2,1,3,2,1,2,1,1,2,3,1,1,1,1,1,2,2,2,2];
begin
  foreach sid in array script_ids loop
    for i in 1..26 loop
      ch := upper_chars[i];
      insert into public.characters (script_id, character, label, letter_case, difficulty, sort_order)
      values (sid, ch, 'Uppercase ' || ch, 'upper', upper_diff[i], i)
      on conflict (script_id, character) do nothing;

      ch := lower_chars[i];
      insert into public.characters (script_id, character, label, letter_case, difficulty, sort_order)
      values (sid, ch, 'Lowercase ' || ch, 'lower', lower_diff[i], 26 + i)
      on conflict (script_id, character) do nothing;
    end loop;
  end loop;
end;
$$;
