-- One row per painting: the gallery index and the like count. The decisions JSON and the
-- images stay in Vercel Blob and are written once; only this table is ever updated.
create table public.paintings (
  id text primary key,
  created_at timestamptz not null,
  prompt text not null,
  palette text not null,
  style text not null,
  layout text not null,
  steps integer not null,
  likes integer not null default 0,
  image text not null,
  thumb text not null,
  json_url text not null
);

create index paintings_created_at_idx on public.paintings (created_at desc);

alter table public.paintings enable row level security;
-- No policies: only the service role (server) reads and writes.

-- Atomic like / unlike, never below zero.
create or replace function public.bump_likes(p_id text, p_delta integer)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.paintings
     set likes = greatest(0, likes + p_delta)
   where id = p_id
  returning likes;
$$;

revoke execute on function public.bump_likes(text, integer) from public, anon, authenticated;
