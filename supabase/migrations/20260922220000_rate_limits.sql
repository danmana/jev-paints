-- Fixed-window counters, one row per key (e.g. ip:1.2.3.4:setup, global:steps:hour). The row's
-- window restarts when it is older than the window length, so the table never grows past the
-- number of distinct keys.
create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count integer not null
);
alter table public.rate_limits enable row level security;

-- Counts one hit and says whether the caller is still within p_limit for this window.
create or replace function public.hit_rate_limit(p_key text, p_limit integer, p_window interval)
returns boolean
language sql
security definer
set search_path = public
as $$
  insert into public.rate_limits (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case when public.rate_limits.window_start < now() - p_window then 1 else public.rate_limits.count + 1 end,
        window_start = case when public.rate_limits.window_start < now() - p_window then now() else public.rate_limits.window_start end
  returning count <= p_limit;
$$;

-- Reads the current count without adding a hit, for the "nearly full" check at setup.
create or replace function public.rate_limit_count(p_key text, p_window interval)
returns integer
language sql
security definer
set search_path = public
as $$
  select coalesce((select count from public.rate_limits where key = p_key and window_start >= now() - p_window), 0);
$$;

revoke execute on function public.hit_rate_limit(text, integer, interval) from public, anon, authenticated;
revoke execute on function public.rate_limit_count(text, interval) from public, anon, authenticated;
