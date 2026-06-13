alter table public.logbook_catches
  add column if not exists catch_weather jsonb,
  add column if not exists catch_score jsonb;
