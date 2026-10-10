## Tasks 31–35 Complete ✅

### Implemented

- Added strict backend DTOs for BOM imports, nodes, warnings, dimension mappings, summary, reuse counts, rolled-up parts, extraction candidates, and all available BOM RPC payloads.
- Extended the typed Supabase database contract with the live BOM tables, views, and RPCs used by the frontend integration layer.
- Added the required `API → repository → mapper` boundary. UI components do not make direct Supabase calls.
- Added snake_case-to-domain mappers for imports, nodes, warnings, mappings, summaries, reuse counts, rollups, and extraction candidates.
- Added an import listing query with project, project-number, lot, status, current/superseded, filename, and root-code filter support.
- Added the persisted BOM selector to the BOM Structure page. It displays file, version, status, and current/superseded state, with loading, empty, error, and retry states.

### Files / Database Changed

- `src/types/database.ts`
- `src/features/bom-structure/api/bomApi.ts`
- `src/features/bom-structure/repositories/bomRepository.ts`
- `src/features/bom-structure/mappers/bomMapper.ts`
- `src/features/bom-structure/types/bomBackend.types.ts`
- `src/features/bom-structure/types/bomDomain.types.ts`
- `src/features/bom-structure/queries/bomKeys.ts`
- `src/features/bom-structure/queries/useBomImports.ts`
- `src/features/bom-structure/components/BomImportSelector.tsx`
- `src/features/bom-structure/BomStructurePage.tsx`
- `src/features/bom-structure/BomStructurePage.css`
- No database schema, data, Storage objects, or Production items were changed.

### Validation

- Verified the live Supabase BOM tables, views, and RPC signatures before implementation.
- `npm.cmd run typecheck` passes.
- `npm.cmd run build` passes.
- `git diff --check` passes.

### Security / Performance

- The browser continues to use the publishable Supabase client only; no service-role key was added.
- The selector query is limited to 250 imports, ordered newest-first, and cached for 30 seconds.
- RLS remains the backend authority for which imports each user can read.

### Remaining Notes

- Selecting a persisted import establishes the persisted-import context. Loading its canonical tree, details, warnings, summaries, and rollups is intentionally reserved for Tasks 44–49.
- The local workbook preview remains unchanged and is still separate from persisted BOM state.

### Next Task

Task 36 — Connect New Import Metadata
