-- =====================================================================
-- Migration 002: Master Brain & SerpApi Real-World Intelligence Layer
-- =====================================================================

-- 1. Topic Intelligence Packs (SerpApi & Reasoning Discovery Cache)
create table if not exists public.topic_intelligence_packs (
  id uuid primary key default gen_random_uuid(),
  topic_key text unique not null,
  topic_name text not null,
  pack_data jsonb not null,
  generated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists idx_topic_packs_key on public.topic_intelligence_packs (topic_key);
create index if not exists idx_topic_packs_expires on public.topic_intelligence_packs (expires_at);

-- 2. Master Brain Streaks & Brain XP
create table if not exists public.master_brain_streaks (
  student_id uuid primary key references public.users(id) on delete cascade,
  brain_streak integer not null default 1,
  total_brain_xp integer not null default 0,
  last_activity_date date,
  completed_challenges text[] default '{}',
  updated_at timestamptz not null default now()
);

-- 3. Master Brain Engagement & Analytics Events
create table if not exists public.master_brain_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.users(id) on delete cascade,
  topic_id text not null,
  challenge_id text not null,
  event_type text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mb_events_student on public.master_brain_events (student_id);
create index if not exists idx_mb_events_type on public.master_brain_events (event_type);
create index if not exists idx_mb_events_created on public.master_brain_events (created_at desc);

-- 4. SerpApi Usage Audit Logs
create table if not exists public.serpapi_usage_logs (
  id uuid primary key default gen_random_uuid(),
  engine text not null,
  query text not null,
  cache_hit boolean not null default false,
  duration_ms integer not null default 0,
  status text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_serpapi_logs_created on public.serpapi_usage_logs (created_at desc);
