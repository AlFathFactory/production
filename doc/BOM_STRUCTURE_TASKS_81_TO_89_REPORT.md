# BOM Structure — Tasks 81–89 Review

## Outcome

Tasks 81–88 have code changes and read-only reviews. Task 89 is a release gate, **not yet passed**. This tranche did not create, change, or delete Production data, and it did not run destructive tests against the live Supabase project `gsiibqwmoqtamruilvec`. Tasks 76–79 were explicitly skipped; their missing automated coverage is a release blocker, not a pass.

## 81 — Observability

Parser, upload, RPC, and version-related failures emit a `bom:error` browser event and a sanitized console error with area, category, safe error code, and timestamp only. Workbook rows, filenames, payloads, and server messages are excluded from the diagnostic event. A unit test verifies that a sensitive filename/payload is not emitted. This is frontend diagnostics, not a server-side telemetry pipeline.

## 82 — User audit visibility

Version history shows imported by, created at, updated by, updated at, and activated at. A single supplementary `app_users` lookup resolves creator/updater names for the loaded history; IDs remain the fallback if the lookup is unavailable. No audit columns or RLS policies were changed.

## 83 — Central settings

`bomSettings.ts` owns the parser version, 25 MB source limit, `.xls`/`.xlsx` extensions and MIME types, import/mapping stale times, and 400-row incremental tree threshold. Source validation and tree/query consumers use the shared values.

## 84 — Legacy path review

The BOM frontend has no localStorage/sessionStorage persistence or alternate BOM API path. Unused descendant-count and local dimension-mapping helpers were removed. Local parsing remains intentionally available for preview; persisted BOM authority remains Page → hook/repository → API → Supabase.

## 85 — Data contract audit

Read-only live-schema inspection compared the current BOM tables, RPC arguments/results, and extraction view with the frontend DTOs. Nullable RPC return fields were corrected in `src/types/database.ts`. Build-time type assertions now compare key RPC arguments, table rows, tree/details/mapping results, and extraction candidate view shape. No reviewed BOM naming/shape mismatch remains. This does not replace a reproducible migration-based schema test; see Task 89.

## 86 — Security review

Read-only inspection found BOM RLS enabled, a private `bom-imports` Storage bucket with a 25 MB Excel MIME allowlist, authenticated-only BOM RPC execution (anon denied), role checks for management/extraction and Admin-only delete, `security_invoker` BOM views, and no `SECURITY DEFINER` BOM API. No service-role key is used by the BOM client. These are policy/code checks, not a signed-in Operator/Supervisor/Admin E2E authority test. The Supabase security advisor reports non-BOM findings elsewhere in the project, so the project-wide security gate remains open.

## 87 — Performance review

The page fetches tree/summary/warnings/rollups independently and node details only for the selected node, avoiding a per-row details request. Version-history user names are batched. Save/replace now invalidate relevant import/version/extraction queries instead of every BOM query. Persisted `byCode` construction no longer copies an array for each repeated code. The tree mounts in 400-row increments and memoizes rows; its expansion state no longer resets on query/tab URL updates. Live indexes cover main import/tree traversal and search paths; the Supabase performance advisor still flags four BOM foreign-key indexes. No live large-data timing was collected because the live BOM tables were empty and this tranche did not write test data.

## 88 — Accessibility review

Tree rows now have a keyboard tab stop, level/expanded/selected state, an accessible name, arrow-key traversal and expand/collapse, and Enter/Space detail opening. Focus is visible and returns to the tree row when details close; Escape closes details or the inline delete confirmation. The delete confirmation focuses its input. Existing form labels, live status/error text, explicit status words and badges were retained. This is a static/code review; a browser/assistive-technology pass remains necessary.

## 89 — Production readiness checklist

| Gate | Status |
| --- | --- |
| TypeScript, unit tests, web build | Pass locally; see command results below. |
| Lint | Not configured (`package.json` has no lint script). |
| Integration tests | Only prior save/replace hook coverage; full Task 77 suite was skipped. |
| E2E/role authority | No executable Task 78–79 suite; skipped at user direction. |
| Desktop build | Windows Tauri build and NSIS bundle passed locally; packaged-app smoke test remains. |
| Supabase advisors | Reviewed read-only; non-BOM security findings and BOM foreign-key index warnings remain. |
| No test data | Live read-only count showed zero BOM imports/nodes and zero BOM-extracted Production items; this tranche created none. |
| No debug logs | No `console.log`, `console.debug`, or `debugger` in the BOM feature. Intentional sanitized `console.error` diagnostics remain. |
| Migration consistency | **Blocked:** the repository contains only two migration files while the live project lists many applied migrations. A fresh environment cannot be certified from this checkout. |

Do not treat Task 89 or the v1 release as complete until these gates are resolved. Do not run destructive BOM E2E against `gsiibqwmoqtamruilvec`; use a dedicated Supabase test project and disposable synthetic records.

## Validation

- `npm.cmd test` — 31/31 passed.
- `npm.cmd run typecheck` — passed after the final changes.
- `npm.cmd run build` — passed; existing Vite large-chunk advisory remains.
- `git diff --check` — passed (Git reports only LF→CRLF working-copy notices).
- `npm.cmd run tauri:build` — passed; Windows executable and NSIS installer produced. Existing static VC runtime deprecation warning remains.
- Supabase schema, RLS, Storage, indexes, data counts, and advisor checks — read-only; no live mutations.
