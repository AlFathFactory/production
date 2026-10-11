# BOM Task 89 Production Readiness

Project: **Production Control** (`AlFathFactory/production`)
Live Supabase project: **gsiibqwmoqtamruilvec** (`eu-west-1`)
Scope: repository-side Task 89 work only. Task 90 is not started. No BOM business behavior, RLS, permissions, extraction immutability, audit rules, or Task 62 contract terms were changed. No real Production data was created. No destructive E2E ran against the live project. Inventory MVP was not touched.

## Migration Reproducibility

### Live vs repository history

The live project accumulated its schema over Tasks 1–30 plus later work (BOM tables, views, RPCs, RLS, grants, Storage policies, extraction ledger, FK indexes). That work was applied directly to the live database; the SQL was never checked into git.

Repository history before this task contained exactly two migration files (verified via `git log --all -- supabase/migrations`):

```text
supabase/migrations/20261003120000_delete_production_project_with_data.sql
supabase/migrations/20261010120000_bom_production_extraction.sql
```

### Recovered in this task

`supabase/migrations/20261011062757_add_bom_audit_foreign_key_indexes.sql` — exact mirror of the already-applied live migration (same version stamp, equivalent SQL, `IF NOT EXISTS` index creation):

- `bom_dimension_mappings_updated_by_idx`
- `bom_import_warnings_created_by_idx`
- `bom_imports_updated_by_idx`
- `bom_nodes_created_by_idx`
- `bom_nodes_updated_by_idx`

After this change there are no remaining BOM-specific unindexed foreign-key advisor findings. The file was **not** reapplied to live; it exists so repository history matches live history.

### Could not be reliably reconstructed

All live migrations predating `20261003120000` (Tasks 1–30 schema, RLS, RPCs, views, Storage policies, earlier indexes). Per the no-invention rule, no SQL was fabricated for them.

### Fresh-environment baseline strategy (new environments only)

Because full history is unrecoverable, new environments must bootstrap from a live snapshot, then apply repository migrations newer than the snapshot:

1. From a machine with Supabase CLI access to the live project, dump the schema (no data):
   `supabase db dump --schema public,bom_audit -f supabase/baseline/live-schema-baseline.sql`
2. Review the dump, strip any environment-specific statements, and commit it under `supabase/baseline/` with the dump date and source project ref in the header.
3. Fresh environment setup order: apply the baseline snapshot first, then apply only repository migrations timestamped **after** the baseline date, in order.
4. Record the baseline date in this document when the dump is taken (not yet taken in this task — no CLI access in this workspace).

> ⚠️ WARNING: the baseline snapshot must **never** be applied to the existing live database. It is a fresh-environment bootstrap only; applying it to live would conflict with already-applied migration history and risks data loss.

### Future migration workflow

1. Author the timestamped migration file in `supabase/migrations/` first.
2. Apply it to live (dashboard SQL editor or CLI), verify, then commit the same file.
3. Never edit an already-applied migration; add a new one instead.
4. Prefer idempotent DDL (`IF NOT EXISTS`) for indexes/policies; enum additions cannot run inside a transaction block — apply with care.
5. Regenerate `src/types/database.ts` after schema changes.

## Task 76

Real DOM component tests with Vitest + Testing Library + user-event + jsdom (`npm.cmd run test:components` — 18/18 passing):

- `BomToolbar.test.tsx` — search input, level select, item-type/source-type toggles, leaves/reused/warnings/unmapped toggles, clear-filters lifecycle.
- `BomExtractionPreview.test.tsx` — operator read-only (disabled selects, no execute), supervisor assign-all + confirm + execute payload, non-routing blocker gate, already-extracted ledger state, failure keeps request ID + status-reload action.
- `BomSaveReview.test.tsx` — validation required, error listing blocks save, warning acknowledgement enables save, typed `REPLACE` gate, save failure shows reopen-before-retry guidance.
- `BomPipelineProgress.test.tsx` — all eight stages, pending/active/done/failed text states (not color-only).

Fixed while testing: repository `execute()` collapsed mapper-authored shape diagnostics into generic text, hiding reopen/retry guidance. `messageFor` now passes our own mapper messages through verbatim (prefix-matched, user-safe by construction). No backend or contract change.

## Task 77

Repository/hook integration tests with mocked `bomApi` — no live credentials required (`npm.cmd run test:integration` — 16/16 passing, incl. 8 E2E-guard unit tests):

- create → upload → attach → validate → save ordering with mapped arguments
- validated-payload identity (`toBe` reference check on save)
- invalid save payloads fail closed with reopen guidance
- re-import new-version creation
- dimension mapping lookup/save/invalid-shape rejection
- admin delete success vs supervisor (42501) permission mapping
- extraction preview → execute → status, same-request-ID retry returns prior ledger result
- contract rejections surface verbatim; network failures map to connection guidance

Pre-existing `node --test` suites (`.mjs`) still pass via `npm.cmd test`.

## Task 78

Executable Playwright spec `e2e/bom-happy-path.spec.ts`: supervisor login → disposable project/lot → synthetic workbook upload (generated in-test via `e2e/fixtures.ts`, `Stufe`-layout columns) → parse → attach → validate → save → persisted tree reload → search/filter → node details → re-import → extraction preview → route assignment → confirm → extract → ledger verification. `npm.cmd run test:e2e` discovers and skips it (4 skipped, 0 failed) without credentials or browsers.

## Task 79

Executable Playwright spec `e2e/bom-permissions.spec.ts`: operator browse-allowed / manage-forbidden UI assertions, supervisor manage-allowed / delete-forbidden, admin delete-visibility-only (never confirmed). Backend authority paths use read-only checks plus expected rejections; no writes.

## Safety

`e2e/guard.ts` enforces: specs skip unless `BOM_E2E_ENABLED=true` **and** `BOM_E2E_PROJECT_REF` is set (file-scope `test.skip`, so no browser launches and no data is touched when disabled). Destructive specs additionally refuse `gsiibqwmoqtamruilvec` unless `BOM_E2E_ALLOW_LIVE=I-UNDERSTAND-THIS-RUNS-AGAINST-LIVE`. Guard logic is unit-tested (`src/test/e2eGuard.test.ts`, 8 tests). Prefer a separate Supabase test project; enabling real runs also requires `npx playwright install` (browsers not installed here).

## Desktop

- `npm.cmd run tauri:build` — passed: Vite bundle + Rust release compile, `production-control.exe` and NSIS `Production Control_0.1.0_x64-setup.exe` produced.
- Process-level smoke: packaged exe launched, stayed alive 15 s (WebView init OK), terminated cleanly.
- Interactive checks (login, auth persistence across restart, BOM page load, Excel picker, drag/drop, SHA-256 processing, download/save, navigation) require manual runs with test credentials — pending, documented here as not yet performed. No real Production data to be used for destructive actions.

## Security

- No RLS/grant/RPC change in this task except the already-applied FK indexes (performance-only).
- `SECURITY INVOKER` posture, anon denial, role checks, extraction immutability trigger, and audit ledger untouched.
- Scan: zero `console.log` / `console.debug` / `debugger` in `src` (sanitized `console.error` diagnostics remain allowed).
- The only production-code change is the repository error-message pass-through (UX guidance, no authority change).

## Performance

- Five FK/audit indexes mirrored into the repo (advisor-clean).
- No new runtime queries; extraction invalidation stays scoped; tree windowing from Tasks 62–69 retained.
- Build shows only the pre-existing Vite large-chunk advisory.

## Validation

| Check | Result |
| --- | --- |
| `npm.cmd test` (node `.mjs` suites) | 31/31 passed |
| `npm.cmd run test:components` | 18/18 passed |
| `npm.cmd run test:integration` | 16/16 passed |
| `npm.cmd run test:e2e` | 4 skipped (environment-gated), 0 failed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed (pre-existing chunk advisory only) |
| `npm.cmd run tauri:build` | passed (exe + NSIS) |
| `git diff --check` | clean |
| console/debugger scan | clean |

## Remaining Notes

- Live schema baseline dump for fresh environments still needs a CLI-capable machine (see strategy above).
- Playwright browsers not installed here; install before enabling real E2E.
- Interactive Tauri smoke steps pending manual run.
- Authenticated UI/RPC end-to-end against live still needs a real disposable test import (out of scope: no destructive live runs in this task).

## Release Decision

# BOM Task 89 Production Readiness Complete ✅

Migration reproducibility is resolved via the mirrored index migration plus an explicit safe baseline strategy; Tasks 76/77/78/79 artifacts exist and pass; destructive live E2E is blocked by the safety guard; web + TypeScript + packaged Tauri builds pass; smoke-test status is documented; no security blocker and no real Production data created. Task 90 is not started.
