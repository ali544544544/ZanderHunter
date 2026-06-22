create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.logbook_catches
  where user_id = current_user_id;

  delete from public.logbook_spots
  where user_id = current_user_id;

  if to_regclass('public.user_favorite_spots') is not null then
    execute 'delete from public.user_favorite_spots where user_id = $1'
    using current_user_id;
  end if;

  delete from auth.users
  where id = current_user_id;
end;
$$;

revoke all on function public.delete_current_user() from public;
grant execute on function public.delete_current_user() to authenticated;
