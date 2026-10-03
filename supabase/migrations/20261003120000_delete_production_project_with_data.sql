-- Admin-only purge of a Production Project and ALL of its project-scoped data.
--
-- HOW TO APPLY:
--   1. Open the Supabase Dashboard -> SQL Editor for this project.
--   2. Paste this file and run it.
--   3. Re-run the Supabase Security Advisor and confirm no new issues.
--
-- DESIGN NOTES:
--   * Single database transaction: any failure rolls back everything,
--     so a project is never left partially deleted.
--   * SECURITY DEFINER is used deliberately: the purge must delete from
--     many tables regardless of per-table RLS delete policies. Real
--     authorization is enforced inside the function (active admin only).
--   * Shared/global data is NEVER deleted: app_users, Auth users, other
--     projects, bending_destinations, dispense_recipients. Only the
--     project's own transactions referencing them are removed.
--   * Frontend must call this RPC once; no browser-side multi-delete.

create or replace function public.delete_production_project_with_data(
  p_project_id uuid,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_project_name text;
  v_numbers int := 0;
  v_lots int := 0;
  v_items int := 0;
  v_entries int := 0;
  v_audits int := 0;
  v_dispatches int := 0;
  v_dispatch_items int := 0;
  v_returns int := 0;
  v_return_items int := 0;
  v_imports int := 0;
begin
  -- 1. Authorization: active admin only. GRANT is not authorization.
  if auth.uid() is null then
    raise exception 'Admin access required';
  end if;

  perform 1
  from public.app_users
  where auth_user_id = auth.uid()
    and is_active = true
    and role = 'admin';

  if not found then
    raise exception 'Admin access required';
  end if;

  -- 2. Resolve the project.
  select project_name
  into v_project_name
  from public.production_projects
  where id = p_project_id;

  if not found then
    raise exception 'Project not found';
  end if;

  -- 3. Confirmation protection: the admin must type the exact project name.
  if btrim(coalesce(p_confirmation, '')) <> v_project_name then
    raise exception 'Project name confirmation does not match';
  end if;

  -- 4. Resolve the full project hierarchy into temp tables so every
  --    delete below is strictly scoped to this project.
  create temporary table tmp_purge_numbers on commit drop as
  select id
  from public.production_project_numbers
  where project_id = p_project_id;

  create temporary table tmp_purge_lots on commit drop as
  select l.id
  from public.production_lots l
  join tmp_purge_numbers n on n.id = l.project_number_id;

  create temporary table tmp_purge_items on commit drop as
  select i.id
  from public.production_items i
  join tmp_purge_lots l on l.id = i.lot_id;

  create temporary table tmp_purge_entries on commit drop as
  select e.id
  from public.production_stage_entries e
  join tmp_purge_items i on i.id = e.production_item_id;

  create temporary table tmp_purge_dispatches on commit drop as
  select d.id
  from public.bending_dispatches d
  join tmp_purge_lots l on l.id = d.lot_id;

  create temporary table tmp_purge_returns on commit drop as
  select r.id
  from public.bending_returns r
  join tmp_purge_dispatches d on d.id = r.dispatch_id;

  -- 5. Delete dependents first, in explicit FK-safe order.

  delete from public.production_stage_entry_audit a
  using tmp_purge_entries e
  where a.stage_entry_id = e.id;
  get diagnostics v_audits = row_count;

  delete from public.bending_return_items ri
  using tmp_purge_returns r
  where ri.return_id = r.id;
  get diagnostics v_return_items = row_count;

  delete from public.bending_returns r
  using tmp_purge_returns t
  where r.id = t.id;
  get diagnostics v_returns = row_count;

  delete from public.bending_dispatch_items di
  using tmp_purge_dispatches d
  where di.dispatch_id = d.id;
  get diagnostics v_dispatch_items = row_count;

  delete from public.production_stage_entries e
  using tmp_purge_entries t
  where e.id = t.id;
  get diagnostics v_entries = row_count;

  delete from public.bending_dispatches d
  using tmp_purge_dispatches t
  where d.id = t.id;
  get diagnostics v_dispatches = row_count;

  delete from public.production_items i
  using tmp_purge_items t
  where i.id = t.id;
  get diagnostics v_items = row_count;

  -- Production imports are lot-scoped. The table may not exist in every
  -- environment, so delete from it only when it is present.
  if to_regclass('public.production_imports') is not null then
    delete from public.production_imports pi
    using tmp_purge_lots l
    where pi.lot_id = l.id;
    get diagnostics v_imports = row_count;
  end if;

  delete from public.production_lots l
  using tmp_purge_lots t
  where l.id = t.id;
  get diagnostics v_lots = row_count;

  delete from public.production_project_numbers n
  using tmp_purge_numbers t
  where n.id = t.id;
  get diagnostics v_numbers = row_count;

  delete from public.production_projects
  where id = p_project_id;

  return jsonb_build_object(
    'success', true,
    'project_id', p_project_id,
    'project_name', v_project_name,
    'deleted', jsonb_build_object(
      'project_numbers', v_numbers,
      'lots', v_lots,
      'production_items', v_items,
      'stage_entries', v_entries,
      'audit_entries', v_audits,
      'dispatches', v_dispatches,
      'dispatch_items', v_dispatch_items,
      'returns', v_returns,
      'return_items', v_return_items,
      'imports', v_imports
    )
  );
end;
$function$;

-- Grants: authenticated and service_role may execute, but the function
-- itself still rejects every non-admin caller. Anonymous gets nothing.
revoke all on function public.delete_production_project_with_data(uuid, text) from public;
revoke all on function public.delete_production_project_with_data(uuid, text) from anon;
grant execute on function public.delete_production_project_with_data(uuid, text) to authenticated;
grant execute on function public.delete_production_project_with_data(uuid, text) to service_role;
