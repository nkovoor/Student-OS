-- Student OS — initial schema (exams, topics, tasks, availability, booked
-- slots, completion log), as approved before this migration was written.
--
-- Every table has a user_id column and a Row Level Security (RLS) policy
-- that only lets a signed-in user see or change rows where user_id matches
-- their own auth.uid(). This is what keeps one student's data invisible to
-- another — enforced by the database itself, not just by app code.

create extension if not exists pgcrypto;

-- One row per exam. Deleting an exam cascades to delete its topics too,
-- matching how "delete exam" already works in the app (removes the whole
-- card, topics included).
create table exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null,
  exam_date date not null,
  created_at timestamptz not null default now()
);

-- One row per topic within an exam.
create table topics (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  estimated_minutes integer not null,
  minutes_done integer not null default 0,
  completed boolean not null default false,
  importance text not null default 'medium' check (importance in ('high', 'medium', 'low')),
  skip_dates date[] not null default '{}',
  created_at timestamptz not null default now()
);

-- One row per standalone task (not attached to an exam).
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null,
  title text not null,
  due_date date not null,
  estimated_minutes integer not null,
  minutes_done integer not null default 0,
  completed boolean not null default false,
  importance text not null default 'medium' check (importance in ('high', 'medium', 'low')),
  skip_dates date[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Exactly one row per weekday per student (7 rows/student). Primary key on
-- (user_id, weekday) means "set Monday's minutes" is just one upsert.
create table availability (
  user_id uuid not null references auth.users (id) on delete cascade,
  weekday text not null check (weekday in ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
  daily_minutes integer not null default 0,
  primary key (user_id, weekday)
);

-- Permanent recurring weekly commitments (sports, music, coaching).
create table booked_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weekday text not null check (weekday in ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
  label text not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

-- Append-only history of completed/partial work, used for the capacity
-- delta. item_id deliberately has no foreign key (it can point at either a
-- topic or a task, and Postgres can't enforce "exists in one of two
-- tables") — item_type is what tells the app which table it came from.
create table completion_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null,
  item_type text not null check (item_type in ('topic', 'task')),
  subject text not null,
  label text not null,
  minutes integer not null,
  date date not null,
  created_at timestamptz not null default now()
);

-- --- Row Level Security ---
-- Enabling RLS with no policy means "deny everything by default." The
-- policy below is the only door in: a user can only see/insert/update/delete
-- rows where user_id is their own id.

alter table exams enable row level security;
alter table topics enable row level security;
alter table tasks enable row level security;
alter table availability enable row level security;
alter table booked_slots enable row level security;
alter table completion_log enable row level security;

create policy "Users manage their own exams" on exams
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own topics" on topics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own tasks" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own availability" on availability
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own booked slots" on booked_slots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own completion log" on completion_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- --- Indexes for the lookups the app actually does ---

create index topics_exam_id_idx on topics (exam_id);
create index topics_user_id_idx on topics (user_id);
create index tasks_user_id_idx on tasks (user_id);
create index booked_slots_user_id_idx on booked_slots (user_id);
create index completion_log_user_id_idx on completion_log (user_id);
