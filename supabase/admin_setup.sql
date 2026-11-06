-- =====================================================================
--  Create Admin@gmail.com (Password: Test21131.) & Grant Admin Access
--  Copy & run this in Supabase → SQL Editor → New query → Run
-- =====================================================================

-- 1. Ensure is_admin() and is_staff() automatically recognize Admin@gmail.com
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(lower(auth.jwt() ->> 'email') = 'admin@gmail.com', false)
      or exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'staff'));
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(lower(auth.jwt() ->> 'email') = 'admin@gmail.com', false)
      or exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin');
$$;

-- 2. Create or update Admin@gmail.com with password "Test21131." (auto-confirmed)
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where lower(email) = 'admin@gmail.com' limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'admin@gmail.com',
      extensions.crypt('Test21131.', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin CetakBanner"}'::jsonb,
      now(),
      now(),
      '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', 'admin@gmail.com', 'email_verified', true),
      'email',
      now(),
      now(),
      now()
    );
  else
    update auth.users
    set encrypted_password = extensions.crypt('Test21131.', extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = v_user_id;
  end if;

  insert into public.user_roles (user_id, role)
  values (v_user_id, 'admin')
  on conflict (user_id) do update set role = 'admin';
end $$;

