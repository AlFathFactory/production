-- Approved Task 62 contract: full, insert-only BOM extraction with explicit routes.
-- The CLI was unavailable in this workspace; keep this checked-in migration in sync
-- with the migration applied to project gsiibqwmoqtamruilvec.

alter type public.production_item_source add value if not exists 'bom_extraction';

create schema if not exists bom_audit;
revoke all on schema bom_audit from public, anon;
grant usage on schema bom_audit to authenticated;

create table bom_audit.extractions (
  id uuid primary key default gen_random_uuid(),
  bom_import_id uuid not null unique references public.bom_imports(id) on delete restrict,
  version_group_id uuid not null,
  version_number integer not null check (version_number > 0),
  lot_id uuid not null references public.production_lots(id) on delete restrict,
  request_id uuid not null unique,
  assignment_fingerprint text not null check (assignment_fingerprint ~ '^[0-9a-f]{32}$'),
  candidate_count integer not null check (candidate_count > 0),
  created_count integer not null check (created_count > 0 and created_count = candidate_count),
  skipped_count integer not null default 0 check (skipped_count = 0),
  source_file_sha256 text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index bom_extractions_lot_id_idx on bom_audit.extractions(lot_id);
create index bom_extractions_created_by_idx on bom_audit.extractions(created_by);

create table bom_audit.extraction_items (
  extraction_id uuid not null references bom_audit.extractions(id) on delete restrict,
  production_item_id uuid not null unique references public.production_items(id) on delete restrict,
  article text not null,
  representative_node_id uuid not null,
  route public.production_route not null,
  total_quantity numeric not null check (total_quantity > 0),
  designation text,
  material text,
  profile text,
  unit_weight_kg numeric,
  primary key (extraction_id, article)
);

create index bom_extraction_items_production_item_idx on bom_audit.extraction_items(production_item_id);

alter table bom_audit.extractions enable row level security;
alter table bom_audit.extraction_items enable row level security;

create policy bom_extractions_active_read on bom_audit.extractions
  for select to authenticated
  using (exists (
    select 1 from public.app_users au
    where au.auth_user_id = (select auth.uid()) and au.is_active = true
  ));

create policy bom_extractions_manager_insert on bom_audit.extractions
  for insert to authenticated
  with check (created_by = (select auth.uid()) and exists (
    select 1 from public.app_users au
    where au.auth_user_id = (select auth.uid()) and au.is_active = true
      and au.role in ('admin'::public.app_role, 'supervisor'::public.app_role)
  ));

create policy bom_extraction_items_active_read on bom_audit.extraction_items
  for select to authenticated
  using (exists (
    select 1 from public.app_users au
    where au.auth_user_id = (select auth.uid()) and au.is_active = true
  ));

create policy bom_extraction_items_manager_insert on bom_audit.extraction_items
  for insert to authenticated
  with check (exists (
    select 1 from bom_audit.extractions e
    where e.id = extraction_id and e.created_by = (select auth.uid())
  ));

revoke all on bom_audit.extractions, bom_audit.extraction_items from public, anon;
grant select, insert on bom_audit.extractions, bom_audit.extraction_items to authenticated;

create or replace function public.get_bom_production_extraction_status(p_bom_import_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public, bom_audit, pg_temp
as $function$
declare
  v_result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.app_users au
    where au.auth_user_id = (select auth.uid()) and au.is_active = true
  ) then
    raise exception 'Active authentication required';
  end if;
  if p_bom_import_id is null then
    raise exception 'p_bom_import_id is required';
  end if;

  select jsonb_build_object(
    'extraction_id', e.id,
    'bom_import_id', e.bom_import_id,
    'version_number', e.version_number,
    'lot_id', e.lot_id,
    'request_id', e.request_id,
    'candidate_count', e.candidate_count,
    'created_count', e.created_count,
    'skipped_count', e.skipped_count,
    'already_extracted', true,
    'created_at', e.created_at
  ) into v_result
  from bom_audit.extractions e
  where e.bom_import_id = p_bom_import_id;
  return v_result;
end;
$function$;

create or replace function public.extract_bom_to_production(
  p_bom_import_id uuid,
  p_assignments jsonb,
  p_request_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public, bom_audit, pg_temp
as $function$
declare
  v_import public.bom_imports;
  v_extraction_id uuid;
  v_candidate_count integer;
  v_assignment_count integer;
  v_inserted_count integer;
  v_fingerprint text;
  v_existing bom_audit.extractions;
  v_result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.app_users au
    where au.auth_user_id = (select auth.uid()) and au.is_active = true
      and au.role in ('admin'::public.app_role, 'supervisor'::public.app_role)
  ) then
    raise exception 'Only active admins or supervisors can extract BOM to Production';
  end if;
  if p_bom_import_id is null or p_request_id is null then
    raise exception 'BOM import ID and request ID are required';
  end if;
  if p_assignments is null or jsonb_typeof(p_assignments) <> 'object' then
    raise exception 'Route assignments must be a JSON object keyed by article';
  end if;

  select * into v_import
  from public.bom_imports bi
  where bi.id = p_bom_import_id
  for update;
  if not found then
    raise exception 'BOM import not found';
  end if;
  -- Canonical fingerprint: JSON object text is key-order sensitive, so sort
  -- assignments by article before hashing. This keeps idempotency stable when
  -- the client serializes the same assignments in a different key order.
  select md5(coalesce(string_agg(k || '=' || v, ',' order by k), ''))
    into v_fingerprint
    from jsonb_each_text(p_assignments);
  select * into v_existing
  from bom_audit.extractions e
  where e.bom_import_id = p_bom_import_id;
  if found then
    if v_existing.request_id = p_request_id and v_existing.assignment_fingerprint = v_fingerprint then
      return public.get_bom_production_extraction_status(p_bom_import_id);
    end if;
    raise exception 'This BOM version was already extracted; changed extraction is not allowed';
  end if;
  if v_import.status <> 'saved' or v_import.superseded_by_import_id is not null then
    raise exception 'Only the current saved BOM version can be extracted';
  end if;
  if v_import.lot_id is null or not exists (
    select 1 from public.production_lots l
    where l.id = v_import.lot_id and l.project_number_id = v_import.project_number_id
  ) then
    raise exception 'BOM lot is missing or no longer matches its project number';
  end if;

  select count(*) into v_candidate_count
  from public.bom_production_extraction_candidates c
  where c.bom_import_id = p_bom_import_id;
  if v_candidate_count = 0 then
    raise exception 'No Production extraction candidates exist for this BOM';
  end if;
  select count(*) into v_assignment_count from jsonb_object_keys(p_assignments);
  if v_assignment_count <> v_candidate_count or exists (
    select 1 from public.bom_production_extraction_candidates c
    where c.bom_import_id = p_bom_import_id and not (p_assignments ? c.article)
  ) then
    raise exception 'Every extraction candidate requires exactly one route assignment';
  end if;
  if exists (
    select 1 from jsonb_each_text(p_assignments) a
    where a.value not in ('BEND','NO BEND','ROD','ROLLING','LADDER','OTHER')
  ) then
    raise exception 'A route assignment is invalid';
  end if;
  if exists (
    select 1 from public.bom_production_extraction_candidates c
    where c.bom_import_id = p_bom_import_id
      and (c.lot_id is distinct from v_import.lot_id
        or c.article is null or btrim(c.article) = ''
        or c.total_quantity is null or c.total_quantity <= 0
        or jsonb_typeof(c.blockers) is distinct from 'array'
        or jsonb_array_length(c.blockers - 'routing-assignment-required') > 0)
  ) then
    raise exception 'BOM extraction has unresolved non-routing blockers';
  end if;
  if exists (
    select 1 from public.production_items pi
    join public.bom_production_extraction_candidates c
      on c.lot_id = pi.lot_id and c.article = pi.article
    where c.bom_import_id = p_bom_import_id
  ) then
    raise exception 'An article already exists in this Production lot; extraction was not started';
  end if;

  insert into bom_audit.extractions (
    bom_import_id, version_group_id, version_number, lot_id, request_id,
    assignment_fingerprint, candidate_count, created_count, source_file_sha256, created_by
  ) values (
    v_import.id, v_import.version_group_id, v_import.version_number, v_import.lot_id,
    p_request_id, v_fingerprint, v_candidate_count, v_candidate_count,
    v_import.source_file_sha256, auth.uid()
  ) returning id into v_extraction_id;

  with candidates as materialized (
    select c.*, n.source_row
    from public.bom_production_extraction_candidates c
    join public.bom_nodes n on n.id = c.representative_node_id
    where c.bom_import_id = p_bom_import_id
  ), inserted as (
    insert into public.production_items (
      lot_id, article, profile, routing, designation, material, unit_weight_kg,
      total_quantity, source, source_row, created_by
    )
    select v_import.lot_id, c.article, c.profile,
      (p_assignments ->> c.article)::public.production_route,
      c.designation, c.material, c.unit_weight_kg, c.total_quantity,
      'bom_extraction'::public.production_item_source, c.source_row, auth.uid()
    from candidates c
    order by c.article
    returning id, article
  )
  insert into bom_audit.extraction_items (
    extraction_id, production_item_id, article, representative_node_id,
    route, total_quantity, designation, material, profile, unit_weight_kg
  )
  select v_extraction_id, i.id, c.article, c.representative_node_id,
    (p_assignments ->> c.article)::public.production_route,
    c.total_quantity, c.designation, c.material, c.profile, c.unit_weight_kg
  from inserted i join candidates c on c.article = i.article;
  get diagnostics v_inserted_count = row_count;
  if v_inserted_count <> v_candidate_count then
    raise exception 'Extraction count mismatch; all writes were rolled back';
  end if;

  v_result := jsonb_build_object(
    'extraction_id', v_extraction_id,
    'bom_import_id', v_import.id,
    'version_number', v_import.version_number,
    'lot_id', v_import.lot_id,
    'request_id', p_request_id,
    'candidate_count', v_candidate_count,
    'created_count', v_inserted_count,
    'skipped_count', 0,
    'already_extracted', false,
    'created_at', now()
  );
  return v_result;
end;
$function$;

create or replace function bom_audit.prevent_extracted_bom_node_change()
returns trigger
language plpgsql
security invoker
set search_path = bom_audit, public, pg_temp
as $function$
begin
  if exists (
    select 1 from bom_audit.extractions e
    where e.bom_import_id = old.bom_import_id
  ) then
    raise exception 'Extracted BOM nodes are immutable; create a new BOM version instead';
  end if;
  return old;
end;
$function$;

create trigger prevent_extracted_bom_node_change
before update or delete on public.bom_nodes
for each row execute function bom_audit.prevent_extracted_bom_node_change();

revoke all on function public.get_bom_production_extraction_status(uuid) from public, anon;
revoke all on function public.extract_bom_to_production(uuid,jsonb,uuid) from public, anon;
grant execute on function public.get_bom_production_extraction_status(uuid) to authenticated;
grant execute on function public.extract_bom_to_production(uuid,jsonb,uuid) to authenticated;
