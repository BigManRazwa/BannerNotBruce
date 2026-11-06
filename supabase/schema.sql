-- =====================================================================
--  CetakBanner — database schema
--  Run this whole file once in Supabase → SQL Editor → New query → Run.
--  It is safe to run again (everything is "create if not exists" / replace).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Staff & admin roles
--    Customers have no row here. Staff/admins are added manually (see bottom).
-- ---------------------------------------------------------------------
create table if not exists public.user_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);
alter table public.user_roles enable row level security;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'staff'));
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin');
$$;

drop policy if exists "roles: read own or admin" on public.user_roles;
create policy "roles: read own or admin" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "roles: admin manages" on public.user_roles;
create policy "roles: admin manages" on public.user_roles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());


-- ---------------------------------------------------------------------
-- 2. Production stages
-- ---------------------------------------------------------------------
do $$ begin
  create type public.order_status as enum
    ('received', 'preflight', 'printing', 'finishing', 'ready', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;


-- ---------------------------------------------------------------------
-- 3. Orders
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_code       text not null unique,
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status           public.order_status not null default 'received',

  size_name        text not null,
  width_cm         int  not null,
  height_cm        int  not null,
  is_custom        boolean not null default false,
  material         text not null,
  grommet          text not null,
  turnaround       text not null default 'standard',
  quantity         int  not null check (quantity between 1 and 1000),
  production_notes text,

  design_path      text,
  design_name      text,
  design_mime      text,
  design_size      bigint,

  -- Prices are always recalculated on the server (see trigger below)
  unit_price       bigint not null default 0,
  subtotal         bigint not null default 0,
  turnaround_fee   bigint not null default 0,
  tax              bigint not null default 0,
  total            bigint not null default 0,

  contact          jsonb not null default '{}'::jsonb,  -- snapshot of the customer's profile at order time
  staff_notes      text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);
alter table public.orders enable row level security;


-- ---------------------------------------------------------------------
-- 4. Status history (one row per stage change → timeline timestamps)
-- ---------------------------------------------------------------------
create table if not exists public.order_events (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     public.order_status not null,
  note       text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events (order_id, created_at);
alter table public.order_events enable row level security;


-- ---------------------------------------------------------------------
-- 5. Triggers
-- ---------------------------------------------------------------------

-- New order: owner, starting status, order code and server-side pricing.
-- Mirrors the price logic in src/context/OrderContext.jsx so customers can't tamper with totals.
create or replace function public.orders_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_price bigint;
  material_fee bigint;
  turn_fee bigint;
begin
  new.user_id := coalesce(auth.uid(), new.user_id);
  new.status := 'received';
  new.order_code := 'CB-' || to_char(now() at time zone 'Asia/Jakarta', 'YYMMDD') || '-'
                    || upper(substr(md5(gen_random_uuid()::text), 1, 5));

  if new.is_custom then
    if new.width_cm not between 20 and 600 or new.height_cm not between 20 and 600 then
      raise exception 'Ukuran custom harus antara 20 dan 600 cm';
    end if;
    new.size_name := 'Ukuran Custom';
    base_price := greatest(50000, round((new.width_cm::numeric * new.height_cm / 10000) * 90000 / 5000) * 5000);
  else
    select s.price into base_price
    from (values (60, 120, 85000), (90, 180, 150000), (120, 240, 250000), (60, 300, 195000),
                 (150, 240, 350000), (240, 120, 320000), (75, 200, 275000)) as s(w, h, price)
    where s.w = new.width_cm and s.h = new.height_cm;
    if base_price is null then raise exception 'Ukuran banner tidak valid'; end if;
  end if;

  material_fee := case new.material
    when '13oz Scrim Matte Vinyl'    then 0
    when '18oz Heavy Blockout Matte' then 35000
    when '9oz Mesh Tahan Angin'      then 25000
  end;
  if material_fee is null then raise exception 'Material tidak valid'; end if;

  turn_fee := case new.turnaround
    when 'standard' then 0
    when 'express'  then 50000
    when 'same_day' then 95000
  end;
  if turn_fee is null then raise exception 'Kecepatan produksi tidak valid'; end if;

  new.unit_price     := base_price + material_fee;
  new.subtotal       := new.unit_price * new.quantity;
  new.turnaround_fee := turn_fee;
  new.tax            := round(new.subtotal * 0.11);
  new.total          := new.subtotal + new.turnaround_fee + new.tax;
  new.created_at     := now();
  new.updated_at     := now();
  return new;
end $$;

drop trigger if exists orders_before_insert on public.orders;
create trigger orders_before_insert before insert on public.orders
  for each row execute function public.orders_before_insert();

create or replace function public.orders_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists orders_before_update on public.orders;
create trigger orders_before_update before update on public.orders
  for each row execute function public.orders_touch_updated_at();

-- Log the first stage when an order is created
create or replace function public.orders_log_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.order_events (order_id, status, note, created_by)
  values (new.id, new.status, 'Pesanan diterima', new.user_id);
  return new;
end $$;

drop trigger if exists orders_after_insert on public.orders;
create trigger orders_after_insert after insert on public.orders
  for each row execute function public.orders_log_created();

-- Log every status change (from the staff panel, or edited directly in the Supabase table editor)
create or replace function public.orders_log_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_events (order_id, status, note, created_by)
    values (new.id, new.status, nullif(current_setting('app.status_note', true), ''), auth.uid());
  end if;
  return new;
end $$;

drop trigger if exists orders_after_update on public.orders;
create trigger orders_after_update after update on public.orders
  for each row execute function public.orders_log_status_change();


-- ---------------------------------------------------------------------
-- 6. Staff action: move an order to another stage (with an optional note)
--    Usage from the app: supabase.rpc('update_order_status', { p_order_id, p_status, p_note })
-- ---------------------------------------------------------------------
create or replace function public.update_order_status(
  p_order_id uuid,
  p_status   public.order_status,
  p_note     text default null
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  result public.orders;
begin
  if not public.is_staff() then
    raise exception 'Hanya staff yang dapat mengubah status pesanan' using errcode = '42501';
  end if;
  perform set_config('app.status_note', coalesce(p_note, ''), true);
  update public.orders set status = p_status where id = p_order_id returning * into result;
  if not found then raise exception 'Pesanan tidak ditemukan'; end if;
  return result;
end $$;

revoke all on function public.update_order_status(uuid, public.order_status, text) from public, anon;
grant execute on function public.update_order_status(uuid, public.order_status, text) to authenticated;


-- ---------------------------------------------------------------------
-- 7. Row Level Security — customers see only their own orders, staff see everything
-- ---------------------------------------------------------------------
drop policy if exists "orders: owner or staff can read" on public.orders;
create policy "orders: owner or staff can read" on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_staff());

drop policy if exists "orders: customers create their own" on public.orders;
create policy "orders: customers create their own" on public.orders
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "orders: staff can update" on public.orders;
create policy "orders: staff can update" on public.orders
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "orders: admin can delete" on public.orders;
create policy "orders: admin can delete" on public.orders
  for delete to authenticated using (public.is_admin());

drop policy if exists "order_events: visible with the order" on public.order_events;
create policy "order_events: visible with the order" on public.order_events
  for select to authenticated using (
    exists (select 1 from public.orders o
            where o.id = order_events.order_id and (o.user_id = auth.uid() or public.is_staff()))
  );
-- No insert/update policy on order_events: rows are only written by the triggers above.


-- ---------------------------------------------------------------------
-- 8. Live updates (the status page refreshes itself when staff change a stage)
-- ---------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object or undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.order_events;
exception when duplicate_object or undefined_object then null; end $$;


-- ---------------------------------------------------------------------
-- 9. Design file storage (private bucket, files stored under <user id>/...)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('designs', 'designs', false, 52428800)  -- 50 MB
on conflict (id) do nothing;

drop policy if exists "designs: customers upload to own folder" on storage.objects;
create policy "designs: customers upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'designs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "designs: owner or staff can read" on storage.objects;
create policy "designs: owner or staff can read" on storage.objects
  for select to authenticated
  using (bucket_id = 'designs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));

drop policy if exists "designs: owner can delete own" on storage.objects;
create policy "designs: owner can delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'designs' and (storage.foldername(name))[1] = auth.uid()::text);


-- ---------------------------------------------------------------------
-- 10. Make the admin account an admin
--     First create the user in Authentication → Users → Add user (tick "Auto Confirm User"),
--     then run just these lines:
-- ---------------------------------------------------------------------
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where lower(email) = 'admin@gmail.com'
-- on conflict (user_id) do update set role = excluded.role;

