-- Anonymous users: a random id minted in the browser and kept in local storage.
alter table public.paintings add column created_by uuid;
create index paintings_created_by_idx on public.paintings (created_by);

-- One like per person per painting. paintings.likes stays as the denormalised count.
create table public.likes (
  painting_id text not null references public.paintings (id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (painting_id, user_id)
);
alter table public.likes enable row level security;

drop function if exists public.bump_likes(text, integer);

-- Like or unlike in one statement, then recount. Returns the new state and count for this painting.
create or replace function public.set_like(p_id text, p_user uuid, p_liked boolean)
returns table (liked boolean, likes integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if not exists (select 1 from public.paintings where id = p_id) then
    return;
  end if;
  if p_liked then
    insert into public.likes (painting_id, user_id) values (p_id, p_user) on conflict do nothing;
  else
    delete from public.likes where painting_id = p_id and user_id = p_user;
  end if;
  select count(*) into n from public.likes where painting_id = p_id;
  update public.paintings set likes = n where id = p_id;
  return query select p_liked, n;
end;
$$;

revoke execute on function public.set_like(text, uuid, boolean) from public, anon, authenticated;
