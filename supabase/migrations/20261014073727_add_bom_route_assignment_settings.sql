-- Already applied to project gsiibqwmoqtamruilvec. Kept here for migration history only.
-- This migration intentionally does not change the production_route enum.

create table public.bom_route_assignment_options (
  id uuid primary key default gen_random_uuid(),
  route public.production_route not null unique,
  label text not null check (btrim(label) <> ''),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.set_bom_route_assignment_option_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
  end if;
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$function$;

create trigger set_bom_route_assignment_option_audit_fields
before insert or update on public.bom_route_assignment_options
for each row execute function public.set_bom_route_assignment_option_audit_fields();

alter table public.bom_route_assignment_options enable row level security;

create policy bom_route_assignment_options_active_read
  on public.bom_route_assignment_options for select to authenticated
  using (exists (
    select 1 from public.app_users au
    where au.auth_user_id = auth.uid() and au.is_active = true
  ));

create policy bom_route_assignment_options_admin_insert
  on public.bom_route_assignment_options for insert to authenticated
  with check (exists (
    select 1 from public.app_users au
    where au.auth_user_id = auth.uid() and au.is_active = true and au.role = 'admin'::public.app_role
  ));

create policy bom_route_assignment_options_admin_update
  on public.bom_route_assignment_options for update to authenticated
  using (exists (
    select 1 from public.app_users au
    where au.auth_user_id = auth.uid() and au.is_active = true and au.role = 'admin'::public.app_role
  )) with check (exists (
    select 1 from public.app_users au
    where au.auth_user_id = auth.uid() and au.is_active = true and au.role = 'admin'::public.app_role
  ));

create policy bom_route_assignment_options_admin_delete
  on public.bom_route_assignment_options for delete to authenticated
  using (exists (
    select 1 from public.app_users au
    where au.auth_user_id = auth.uid() and au.is_active = true and au.role = 'admin'::public.app_role
  ));

grant select, insert, update, delete on public.bom_route_assignment_options to authenticated;
revoke all on public.bom_route_assignment_options from anon;
