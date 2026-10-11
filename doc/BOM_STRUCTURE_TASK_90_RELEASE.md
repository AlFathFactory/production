# BOM Structure v1 — Release Report

## Task 90 Complete ✅

Task 90 is a verification-only release gate: no production code, schema, RLS, or permission was changed in this tranche (`git status` clean afterwards). Each release criterion below was checked against the current implementation, and the full validation suite was re-run. No live data was created, modified, or deleted; no destructive E2E ran against `gsiibqwmoqtamruilvec`; the Inventory MVP project was not touched.

### Implemented

Release-criterion verification against the current tree:

- **Persisted BOM works** — `BomImportPreparation` (create → upload → attach with SHA-256) plus `BomSaveReview` (backend validate → warning acknowledgement → atomic save/replace) remain wired through `useBomImportPreparation` / `useBomNodeSave` → repository → RPC. No transient frontend IDs enter the persistence contract.
- **Reload works** — persisted tree/summary/warnings/rollups load per selected import, and `bomUrlState.ts` round-trips `bomImportId`, node, tab, query, and filters, so refresh restores context.
- **Versioning works** — `BomVersionHistory` with current-version resolution, same-version `Replace` (typed confirmation, parser-version guard), and `create_bom_reimport` candidates that stay inactive until saved while the previous version remains current.
- **Permissions work** — `canManageBomImports` gates management UI (Operator read-only), Admin-only delete with exact confirmation, Supervisor/Admin extraction execution; backend RPCs enforce roles independently and stay `SECURITY INVOKER`.
- **Mappings work** — `BomDimensionMapper` (lookup via `get_bom_dimension_mapping`, save via `save_bom_dimension_mapping`) is embedded in node details; mappings persist server-side, never localStorage-first.
- **Source workbook retained** — original workbook uploads to the private `bom-imports` bucket, attaches checksum metadata, and downloads via the authenticated private flow (web Blob / desktop Save-As). No public bucket.
- **Warnings retained** — backend validation warnings persist per import and render in `BomWarnings` in persisted mode, surviving reload.
- **Extraction preview works** — read-only candidate preview plus the approved Task 62 flow: per-article explicit routes, non-routing blocker gate, version/lot/count confirmation, atomic ledger-backed execute with idempotent request IDs, and already-extracted state. No silent Production writes.
- **Tests pass** — full suite green (see Validation).

### Files / Database Changed

- Added: `doc/BOM_STRUCTURE_TASK_90_RELEASE.md` (this report).
- No application, migration, RLS, Storage, or RPC changes. Live database untouched.

### Validation

| Check | Result |
| --- | --- |
| `npm.cmd test` (node suites: parser, mappers, payload, guards, permissions, URL state, recovery, pipeline) | 31/31 passed |
| `npm.cmd run test:components` (Toolbar, ExtractionPreview, SaveReview, PipelineProgress) | 18/18 passed |
| `npm.cmd run test:integration` (import flow, mapping, delete permissions, extraction + idempotent retry, guard) | 16/16 passed |
| `npm.cmd run test:e2e` (happy path + role permissions, env-gated) | 4 skipped, 0 failed — no credentials, no browsers, no data touched |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed (pre-existing large-chunk advisory only) |
| `npm.cmd run tauri:build` | passed — exe + NSIS bundle produced |
| `git diff --check` | clean |
| Debug-log scan (`console.log` / `console.debug` / `debugger` in `src`) | zero matches; sanitized `console.error` diagnostics remain by design |

Prior-tranche evidence incorporated by reference: Supabase advisor BOM foreign-key findings resolved via applied migration `20261011062757` (mirrored in repo); read-only live counts showed zero BOM imports/nodes and zero BOM-extracted Production items, and this tranche created none; packaged-app process smoke passed at Task 89 with interactive desktop checks documented as manual.

### Security / Performance

- Unchanged from the Task 86/87/89 reviews: private bucket with 25 MB Excel allowlist, anon denied, role-checked RPCs, Admin-only delete, `security_invoker` views, no `SECURITY DEFINER` BOM API, no `service_role` in the client, extracted-node immutability trigger, extraction audit ledger.
- Tree renders incrementally (400-row slices, memoized rows); details load per selected node only; save/replace invalidate scoped query keys; FK/audit indexes in place.

### Remaining Notes

- No lint script is configured (`package.json`) — pre-existing, out of scope for this release; TypeScript + build + tests are the enforced gates.
- The Supabase security advisor reports non-BOM findings elsewhere in the project (per Task 86 review); no BOM-specific blocker remains.
- Full migration history before `20261003120000` is not reconstructible from git; the approved baseline strategy lives in `doc/BOM_TASK_89_PRODUCTION_READINESS.md`.
- Live end-to-end with real disposable data (all roles, desktop interactive pass, large-dataset timings) still requires test credentials, a dedicated test project, and manual runs — tracked as post-v1 hardening, not release criteria.
- Known minor UX debt (non-blocking): delete dialog does not yet explain the extracted-import immutability rejection; route-blocker uses a native confirm dialog.

### Next Task

No further roadmap tasks — BOM Structure v1 is released. Future work proceeds only via the Future Optional Phase (`BOM_STRUCTURE_ZERO_TO_HERO_PLAN.md` §32–33: version diffs, approval workflow, mapping templates, traceability, bulk/partial extraction), each requiring its own explicit approval.
