-- AURA Learn — full Supabase schema
-- Paste this entire file into Supabase Dashboard → SQL Editor → New query → Run.
-- This is deliberately idempotent enough for a first installation. Do not put a service-role key in client code.

create type public.aura_role as enum ('student', 'facilitator');
create type public.class_role as enum ('student', 'facilitator');
create type public.intervention_status as enum ('detected', 'recommended', 'viewed', 'started', 'responding', 'resolved');
create type public.intervention_severity as enum ('intervention', 'immediate');
create type public.adaptive_event_type as enum ('level', 'struggle', 'intervention', 'unlock', 'mastered', 'lab', 'prerequisite');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null check (char_length(name) between 2 and 60),
  role public.aura_role not null default 'student',
  grade smallint check (grade between 5 and 12),
  school text check (char_length(school) <= 80),
  onboarded boolean not null default false,
  learning_pace smallint not null default 70 check (learning_pace between 0 and 100),
  confidence smallint not null default 70 check (confidence between 0 and 100),
  engagement smallint not null default 70 check (engagement between 0 and 100),
  interests text[] not null default '{}',
  learning_preference text check (learning_preference in ('visual', 'practice-first', 'explanation-first', 'interactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  school text check (char_length(school) <= 80),
  created_at timestamptz not null default now()
);

create table public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.class_role not null,
  created_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create table public.subjects (
  id text primary key,
  name text not null,
  grade smallint not null check (grade between 5 and 12),
  accent text not null check (accent in ('brand', 'accent', 'success')),
  course_title text not null,
  goal_topic_id text,
  is_published boolean not null default true
);

create table public.topics (
  id text primary key,
  subject_id text not null references public.subjects(id) on delete cascade,
  name text not null,
  description text not null,
  difficulty smallint not null check (difficulty between 1 and 4),
  position smallint not null check (position > 0),
  unique (subject_id, position)
);
alter table public.subjects add constraint subjects_goal_topic_fk foreign key (goal_topic_id) references public.topics(id) deferrable initially deferred;

create table public.prerequisites (
  topic_id text not null references public.topics(id) on delete cascade,
  prerequisite_id text not null references public.topics(id) on delete restrict,
  primary key (topic_id, prerequisite_id),
  check (topic_id <> prerequisite_id)
);

create table public.questions (
  id text primary key,
  topic_id text not null references public.topics(id) on delete cascade,
  level smallint not null check (level between 1 and 4),
  question_type text not null check (question_type in ('mcq', 'numeric')),
  stem text not null,
  options jsonb,
  answer text not null,
  numeric_answer numeric,
  unit text,
  tolerance numeric,
  hint text not null,
  explanation text not null,
  objective text not null,
  variables jsonb,
  formula text,
  check ((question_type = 'mcq' and options is not null) or (question_type = 'numeric' and numeric_answer is not null))
);

create table public.student_mastery (
  student_id uuid not null references public.profiles(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete cascade,
  score numeric(5,2) not null default 0 check (score between 0 and 100),
  attempts integer not null default 0 check (attempts >= 0),
  accuracy numeric(5,2) not null default 0 check (accuracy between 0 and 100),
  level smallint not null default 1 check (level between 1 and 4),
  last_activity timestamptz,
  level_changed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (student_id, topic_id)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null references public.questions(id) on delete restrict,
  topic_id text not null references public.topics(id) on delete restrict,
  level smallint not null check (level between 1 and 4),
  answer text not null check (char_length(answer) <= 200),
  correct boolean not null,
  skipped boolean not null default false,
  time_taken_sec integer not null check (time_taken_sec between 0 and 3600),
  hints_used smallint not null default 0 check (hints_used between 0 and 5),
  theme jsonb,
  created_at timestamptz not null default now()
);

create table public.interventions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete restrict,
  risk_score numeric(5,2) not null check (risk_score between 0 and 100),
  peak_score numeric(5,2) not null check (peak_score between 0 and 100),
  severity public.intervention_severity not null,
  reason text not null,
  main_issue text not null,
  blocks_topic_id text references public.topics(id) on delete set null,
  recommended_action text not null,
  actions jsonb not null default '[]'::jsonb,
  assigned_action jsonb,
  assigned_at timestamptz,
  signals jsonb not null default '[]'::jsonb,
  status public.intervention_status not null default 'detected',
  student_requested_help boolean not null default false,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text check (resolved_by in ('aura', 'student', 'facilitator'))
);

create unique index one_open_intervention_per_topic on public.interventions(student_id, topic_id) where status <> 'resolved';

create table public.lab_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lab_id text not null,
  score numeric(5,2) not null check (score between 0 and 100),
  mistakes integer not null default 0 check (mistakes >= 0),
  created_at timestamptz not null default now()
);

create table public.adaptive_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete restrict,
  event_type public.adaptive_event_type not null,
  tone text not null check (tone in ('good', 'info', 'warn', 'alert')),
  title text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

create table public.question_serves (
  student_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  served_at timestamptz not null default now(),
  hints_used smallint not null default 0 check (hints_used between 0 and 5),
  primary key (student_id, question_id)
);

create table public.theme_cache (
  cache_key text primary key,
  question_id text not null references public.questions(id) on delete cascade,
  interest text not null,
  stem text not null,
  options jsonb,
  model text not null,
  checks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index attempts_student_topic_created_idx on public.attempts(student_id, topic_id, created_at desc);
create index mastery_student_idx on public.student_mastery(student_id);
create index interventions_student_status_idx on public.interventions(student_id, status, updated_at desc);
create index interventions_topic_status_idx on public.interventions(topic_id, status);
create index events_student_created_idx on public.adaptive_events(student_id, created_at desc);
create index class_members_user_idx on public.class_members(user_id);

-- Security-definer helpers are kept in a non-exposed schema and use qualified object names.
create schema if not exists private;
revoke all on schema private from public;

create or replace function private.can_access_student(target_student uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) = target_student
    or exists (
      select 1
      from public.class_members as facilitator_member
      join public.class_members as student_member on student_member.class_id = facilitator_member.class_id
      where facilitator_member.user_id = (select auth.uid())
        and facilitator_member.role = 'facilitator'
        and student_member.user_id = target_student
    );
$$;

grant usage on schema private to authenticated;
grant execute on function private.can_access_student(uuid) to authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, coalesce(new.email, ''), coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, 'Learner'), '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.lock_profile_role()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.role is distinct from new.role
     and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'A profile role can only be changed by the server.';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_auth_user();
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger mastery_updated_at before update on public.student_mastery for each row execute procedure public.set_updated_at();
create trigger interventions_updated_at before update on public.interventions for each row execute procedure public.set_updated_at();
create trigger lock_profile_role before update on public.profiles for each row execute procedure public.lock_profile_role();

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.prerequisites enable row level security;
alter table public.questions enable row level security;
alter table public.student_mastery enable row level security;
alter table public.attempts enable row level security;
alter table public.interventions enable row level security;
alter table public.lab_events enable row level security;
alter table public.adaptive_events enable row level security;
alter table public.question_serves enable row level security;
alter table public.theme_cache enable row level security;

-- Browser clients only read their allowed rows. The Next.js server writes adaptive decisions with
-- a server-only service-role key after it has authenticated and authorised the current user.
create policy "profiles: own or class facilitator can read" on public.profiles for select to authenticated using (private.can_access_student(id));
create policy "profiles: own record can update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "classes: member can read" on public.classes for select to authenticated using (exists (select 1 from public.class_members m where m.class_id = classes.id and m.user_id = (select auth.uid())));
create policy "class members: member can read" on public.class_members for select to authenticated using (private.can_access_student(user_id));

create policy "published subjects are readable" on public.subjects for select to authenticated using (is_published);
create policy "published topics are readable" on public.topics for select to authenticated using (exists (select 1 from public.subjects s where s.id = topics.subject_id and s.is_published));
create policy "published prerequisites are readable" on public.prerequisites for select to authenticated using (exists (select 1 from public.topics t join public.subjects s on s.id = t.subject_id where t.id = prerequisites.topic_id and s.is_published));
-- Questions intentionally have no authenticated-client SELECT policy: they include answer keys.
-- The Next.js server chooses and grades questions with its server-only service-role key, then sends
-- the existing public question shape to the browser.

create policy "mastery: student or facilitator can read" on public.student_mastery for select to authenticated using (private.can_access_student(student_id));
create policy "attempts: student or facilitator can read" on public.attempts for select to authenticated using (private.can_access_student(student_id));
create policy "interventions: student or facilitator can read" on public.interventions for select to authenticated using (private.can_access_student(student_id));
create policy "labs: student or facilitator can read" on public.lab_events for select to authenticated using (private.can_access_student(student_id));
create policy "events: student or facilitator can read" on public.adaptive_events for select to authenticated using (private.can_access_student(student_id));
create policy "validated themes are readable" on public.theme_cache for select to authenticated using (true);

revoke all on all tables in schema public from anon;
grant select on public.profiles, public.classes, public.class_members, public.subjects, public.topics, public.prerequisites, public.student_mastery, public.attempts, public.interventions, public.lab_events, public.adaptive_events, public.theme_cache to authenticated;
grant update (name, grade, school, onboarded, learning_pace, confidence, engagement, interests, learning_preference) on public.profiles to authenticated;

-- This schema is ready. Next: seed subjects/topics/questions, then point AURA's db/repository layer
-- at Supabase using SUPABASE_SERVICE_ROLE_KEY on the server only.
