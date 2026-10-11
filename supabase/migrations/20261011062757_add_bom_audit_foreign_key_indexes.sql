-- Mirror of the already-applied live migration 20261011062757.
-- Applied to project gsiibqwmoqtamruilvec on 2026-10-11; committed here so
-- repository history matches live history. Do NOT reapply to the live
-- project. These indexes cover BOM audit/ownership foreign keys flagged by
-- the Supabase advisor (no remaining BOM-specific unindexed-FK findings).

create index if not exists bom_dimension_mappings_updated_by_idx
  on public.bom_dimension_mappings (updated_by);

create index if not exists bom_import_warnings_created_by_idx
  on public.bom_import_warnings (created_by);

create index if not exists bom_imports_updated_by_idx
  on public.bom_imports (updated_by);

create index if not exists bom_nodes_created_by_idx
  on public.bom_nodes (created_by);

create index if not exists bom_nodes_updated_by_idx
  on public.bom_nodes (updated_by);
