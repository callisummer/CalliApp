-- Drop old calligraphy tables
drop table if exists public.user_progress cascade;
drop table if exists public.practice_attempts cascade;
drop table if exists public.practice_sessions cascade;
drop table if exists public.characters cascade;
drop table if exists public.scripts cascade;

-- user_content: key-value text store for single-entry sections
create table public.user_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  content text,
  updated_at timestamptz not null default now(),
  unique(user_id, key)
);
alter table public.user_content enable row level security;
create policy "own" on public.user_content for all using (auth.uid() = user_id);

-- daily_intentions
create table public.daily_intentions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  focus text, intention text,
  affirmations text[], gratitude text[],
  evening_reflection text,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);
alter table public.daily_intentions enable row level security;
create policy "own" on public.daily_intentions for all using (auth.uid() = user_id);

-- practices
create table public.practices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, category text, frequency text,
  description text, is_active boolean default true, sort_order int default 0,
  created_at timestamptz not null default now()
);
alter table public.practices enable row level security;
create policy "own" on public.practices for all using (auth.uid() = user_id);

create table public.practice_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete cascade,
  date date not null, notes text,
  created_at timestamptz not null default now(),
  unique(practice_id, date)
);
alter table public.practice_logs enable row level security;
create policy "own" on public.practice_logs for all using (auth.uid() = user_id);

-- health_logs
create table public.health_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  sleep_hours decimal(4,1), sleep_quality int check(sleep_quality between 1 and 5),
  cycle_day int, cycle_phase text, energy_level int check(energy_level between 1 and 5),
  water_oz int, meals jsonb, workouts jsonb, supplements text, notes text,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);
alter table public.health_logs enable row level security;
create policy "own" on public.health_logs for all using (auth.uid() = user_id);

-- journal_entries
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  type text, title text, prompt text, content text not null,
  mood int check(mood between 1 and 5), tags text[],
  created_at timestamptz not null default now()
);
alter table public.journal_entries enable row level security;
create policy "own" on public.journal_entries for all using (auth.uid() = user_id);

-- transactions
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  type text not null check(type in ('income','expense')),
  category text not null, description text,
  amount decimal(10,2) not null, payment_method text, is_recurring boolean default false,
  created_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "own" on public.transactions for all using (auth.uid() = user_id);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_year text not null, category text not null, budgeted_amount decimal(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, month_year, category)
);
alter table public.budget_items enable row level security;
create policy "own" on public.budget_items for all using (auth.uid() = user_id);

-- debts
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, lender text,
  original_amount decimal(10,2) not null, current_balance decimal(10,2) not null,
  interest_rate decimal(5,2), min_payment decimal(10,2),
  due_date int, strategy text, target_payoff date, notes text,
  is_paid_off boolean default false,
  created_at timestamptz not null default now()
);
alter table public.debts enable row level security;
create policy "own" on public.debts for all using (auth.uid() = user_id);

-- credit_actions
create table public.credit_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, description text,
  status text default 'todo' check(status in ('todo','in_progress','done')),
  impact text check(impact in ('high','medium','low')),
  created_at timestamptz not null default now()
);
alter table public.credit_actions enable row level security;
create policy "own" on public.credit_actions for all using (auth.uid() = user_id);

-- investments
create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, type text,
  amount_invested decimal(10,2) default 0, current_value decimal(10,2) default 0,
  account text, notes text,
  created_at timestamptz not null default now()
);
alter table public.investments enable row level security;
create policy "own" on public.investments for all using (auth.uid() = user_id);

create table public.income_streams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, type text,
  status text default 'idea' check(status in ('idea','planning','active','paused')),
  monthly_amount decimal(10,2), description text, next_steps text,
  created_at timestamptz not null default now()
);
alter table public.income_streams enable row level security;
create policy "own" on public.income_streams for all using (auth.uid() = user_id);

-- dream_home
create table public.dream_home (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, room text, description text,
  image_url text, vibe text,
  status text default 'dream' check(status in ('dream','saving','purchased')),
  budget decimal(10,2), notes text,
  created_at timestamptz not null default now()
);
alter table public.dream_home enable row level security;
create policy "own" on public.dream_home for all using (auth.uid() = user_id);

-- hair_clients
create table public.hair_clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, phone text, email text, birthday date,
  hair_type text, hair_texture text, allergies text,
  color_formula text, notes text, referred_by text,
  is_active boolean default true,
  created_at timestamptz not null default now()
);
alter table public.hair_clients enable row level security;
create policy "own" on public.hair_clients for all using (auth.uid() = user_id);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.hair_clients(id) on delete set null,
  client_name text, date timestamptz not null,
  service text, price decimal(10,2), duration_min int,
  color_used text, notes text,
  status text default 'scheduled' check(status in ('scheduled','completed','cancelled','no-show')),
  created_at timestamptz not null default now()
);
alter table public.appointments enable row level security;
create policy "own" on public.appointments for all using (auth.uid() = user_id);

-- services (hair menu)
create table public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, category text,
  price decimal(10,2), duration_min int,
  description text, is_active boolean default true,
  created_at timestamptz not null default now()
);
alter table public.services enable row level security;
create policy "own" on public.services for all using (auth.uid() = user_id);

-- business_items (checklists/tasks for planning/brand/digital)
create table public.business_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section text not null, category text,
  title text not null, description text,
  status text default 'todo' check(status in ('todo','in_progress','done')),
  priority text check(priority in ('high','medium','low')),
  due_date date, sort_order int default 0,
  created_at timestamptz not null default now()
);
alter table public.business_items enable row level security;
create policy "own" on public.business_items for all using (auth.uid() = user_id);

-- content_ideas
create table public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, description text,
  platform text, content_type text,
  status text default 'idea' check(status in ('idea','scripted','filmed','published')),
  scheduled_date date, tags text[],
  created_at timestamptz not null default now()
);
alter table public.content_ideas enable row level security;
create policy "own" on public.content_ideas for all using (auth.uid() = user_id);

-- testimonials
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null, content text not null,
  service text, date date, platform text,
  is_featured boolean default false,
  created_at timestamptz not null default now()
);
alter table public.testimonials enable row level security;
create policy "own" on public.testimonials for all using (auth.uid() = user_id);

-- library_items
create table public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, author text,
  type text check(type in ('book','course','podcast','certification','article','other')),
  category text,
  status text default 'want' check(status in ('want','reading','completed','paused')),
  rating int check(rating between 1 and 5),
  notes text, key_lessons text, link text,
  created_at timestamptz not null default now()
);
alter table public.library_items enable row level security;
create policy "own" on public.library_items for all using (auth.uid() = user_id);

-- plant_medicine
create table public.plant_medicine (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text, plant text, teacher text, lineage text,
  date date, content text, intentions text, insights text, integration text,
  created_at timestamptz not null default now()
);
alter table public.plant_medicine enable row level security;
create policy "own" on public.plant_medicine for all using (auth.uid() = user_id);

-- coaching_modalities
create table public.coaching_modalities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, description text, teacher text, institution text,
  status text default 'exploring' check(status in ('exploring','studying','certified','practicing')),
  start_date date, cert_date date, notes text, how_i_use_it text,
  created_at timestamptz not null default now()
);
alter table public.coaching_modalities enable row level security;
create policy "own" on public.coaching_modalities for all using (auth.uid() = user_id);

-- goals
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, description text,
  area text, timeline text check(timeline in ('1-year','3-year','5-year','10-year')),
  status text default 'active' check(status in ('active','achieved','revised','released')),
  why text, steps text, target_date date, achieved_at date,
  created_at timestamptz not null default now()
);
alter table public.goals enable row level security;
create policy "own" on public.goals for all using (auth.uid() = user_id);

-- vision_items
create table public.vision_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, description text, category text,
  image_url text, affirmation text,
  status text default 'dreaming' check(status in ('dreaming','manifesting','achieved')),
  created_at timestamptz not null default now()
);
alter table public.vision_items enable row level security;
create policy "own" on public.vision_items for all using (auth.uid() = user_id);

-- relationships
create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, relationship text,
  birthday date, contact text, location text,
  how_we_met text, why_important text, notes text, last_contact date,
  created_at timestamptz not null default now()
);
alter table public.relationships enable row level security;
create policy "own" on public.relationships for all using (auth.uid() = user_id);

-- mentors
create table public.mentors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, specialty text, relationship text,
  contact text, website text, what_i_learn text, notes text, gratitude text,
  created_at timestamptz not null default now()
);
alter table public.mentors enable row level security;
create policy "own" on public.mentors for all using (auth.uid() = user_id);

-- events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, type text, date date, location text, description text,
  cost decimal(10,2),
  status text default 'wishlist' check(status in ('wishlist','registered','attended','cancelled')),
  notes text,
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;
create policy "own" on public.events for all using (auth.uid() = user_id);

create table public.network (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, type text, specialty text,
  contact text, how_we_met text, collab_ideas text, notes text,
  created_at timestamptz not null default now()
);
alter table public.network enable row level security;
create policy "own" on public.network for all using (auth.uid() = user_id);

-- travel_wishlist
create table public.travel_wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination text not null, country text, type text,
  description text, why text, budget decimal(10,2),
  ideal_time text,
  status text default 'dream' check(status in ('dream','planning','booked','visited')),
  visited_at date, notes text,
  created_at timestamptz not null default now()
);
alter table public.travel_wishlist enable row level security;
create policy "own" on public.travel_wishlist for all using (auth.uid() = user_id);

-- creative_projects
create table public.creative_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, type text, description text, inspiration text,
  status text default 'idea' check(status in ('idea','in-progress','complete','on-hold')),
  started_at date, notes text,
  created_at timestamptz not null default now()
);
alter table public.creative_projects enable row level security;
create policy "own" on public.creative_projects for all using (auth.uid() = user_id);

create table public.inspiration (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, creator text,
  type text check(type in ('book','music','movie','art','person','quote','other')),
  why text,
  created_at timestamptz not null default now()
);
alter table public.inspiration enable row level security;
create policy "own" on public.inspiration for all using (auth.uid() = user_id);
