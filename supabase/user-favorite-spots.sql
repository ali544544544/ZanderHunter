create table if not exists public.user_favorite_spots (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  spot jsonb not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.user_favorite_spots enable row level security;

drop policy if exists "Users can read own favorite spots" on public.user_favorite_spots;
create policy "Users can read own favorite spots"
on public.user_favorite_spots
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own favorite spots" on public.user_favorite_spots;
create policy "Users can insert own favorite spots"
on public.user_favorite_spots
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own favorite spots" on public.user_favorite_spots;
create policy "Users can update own favorite spots"
on public.user_favorite_spots
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorite spots" on public.user_favorite_spots;
create policy "Users can delete own favorite spots"
on public.user_favorite_spots
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.set_user_favorite_spots_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_favorite_spots_set_updated_at on public.user_favorite_spots;
create trigger user_favorite_spots_set_updated_at
before update on public.user_favorite_spots
for each row
execute function public.set_user_favorite_spots_updated_at();

create or replace function public.enforce_user_favorite_spot_limit()
returns trigger
language plpgsql
as $$
declare
  existing_count integer;
begin
  select count(*)
  into existing_count
  from public.user_favorite_spots
  where user_id = new.user_id
    and id <> new.id;

  if existing_count >= 5 then
    raise exception 'You can save at most 5 favorite spots.';
  end if;

  return new;
end;
$$;

drop trigger if exists user_favorite_spots_limit on public.user_favorite_spots;
create trigger user_favorite_spots_limit
before insert on public.user_favorite_spots
for each row
execute function public.enforce_user_favorite_spot_limit();
