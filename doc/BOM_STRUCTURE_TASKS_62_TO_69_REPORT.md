# BOM Structure — Tasks 62–69 Report

## Outcome

Tasks 62–69 are implemented in the working tree. Page → hook/repository → API → Supabase layering is preserved, no UI component calls Supabase directly, and no Production write path bypasses the approved Task 62 contract.

Status on entry: Task 62 had an approved proposal (`doc/BOM_TASK_62_EXTRACTION_CONTRACT_PROPOSAL.md`, approved 2026-10-10). Task 63 existed only as unapplied local scaffolding (unchecked-in migration, `bomApi` stubs with no repository/mapper/UI wiring). Tasks 64–69 were open.

## Implemented

| Task | Result |
| --- | --- |
| 62 — Extraction contract | No change needed. The approved proposal (full-version scope, explicit route per candidate, lot pinned to the BOM import, abort-on-duplicate `(lot_id, article)`, insert-only with `bom_extraction` source, ledger + per-candidate links, idempotent request IDs, current-saved-only, atomic rollback, Admin/Supervisor only) is the enforced spec for 63–64. |
| 63 — Extraction persistence backend | Hardened `supabase/migrations/20261010120000_bom_production_extraction.sql`: canonical key-ordered assignment fingerprint (`string_agg(k \|\| '=' \|\| v order by k)` instead of order-sensitive `md5(json::text)`), ledger `bom_audit.extractions` (unique per BOM import + unique request ID, `created_count = candidate_count`, `skipped_count = 0`), `bom_audit.extraction_items` links, atomic `extract_bom_to_production` (role/version/lot/candidate/blocker/duplicate checks, single-transaction ledger + Production inserts + links), read-only `get_bom_production_extraction_status`, node-immutability trigger after extraction, RLS + grants, `SECURITY INVOKER` throughout. |
| 64 — Final extraction UI | `BomExtractionPreview` is now the complete flow: ledger status check, explicit per-article route selects (assignments keyed by article, matching the RPC contract), non-routing blocker gate, version/lot/count confirmation checkbox, execute via stable request ID, typed result panel, and ambiguous-error recovery (reload ledger status; retries reuse the same request ID). Execute is visible only to active Supervisor/Admin; Operators keep read-only preview. Success invalidates `bom` extraction-status/preview keys and `productionKeys.all`. |
| 65 — Import progress UX | New 8-stage tracker (`BomPipelineProgress` + pure `buildBomPipelineStages`): Parsing → Validating → Creating Import → Uploading File → Attaching Metadata → Saving Structure → Refreshing Data → Complete, with pending/active/done/failed per stage, shown only while a pipeline is active. |
| 66 — Error recovery | New pure `getBomRecoveryAdvice` + inline notice covering: record-not-created retry, upload-failed reuse-same-record, attach-failed reuse-same-record, save-failed re-validate on same import, ambiguous-network reopen-before-retry, extraction ledger recheck. No auto-retries of ambiguous writes anywhere. |
| 67 — Unsaved changes guard | New `useBomUnsavedGuard`: blocks in-app route changes (`useBlocker` + confirm), browser reload/close (`beforeunload`), and best-effort Tauri window close (`onCloseRequested`, dynamically imported, failure-safe). Active for local preview, incomplete attachment, re-import candidate, replacement, and unacknowledged validation. |
| 68 — Large BOM rendering | `BomTree` now renders incrementally (400-row slices + “Show more” with live counts), memoized rows keyed on stable node references, and stable page callbacks (`useCallback`) so expand/collapse/search no longer remount the whole tree. Reveal-scroll grows the window when the target is past the limit. |
| 69 — Persisted tree search | Search now covers code, name, name2, **description** (previously promised by the toolbar placeholder but not matched), material, and drawing number; the result meta shows live match counts (`N matches · X of Y rows visible`) with `role="status"`. Search stays client-side over the already-loaded persisted tree; backend text indexes remain available for future server-side search. |

## Files / Database Changed

- `supabase/migrations/20261010120000_bom_production_extraction.sql` (fingerprint hardening; otherwise as reviewed)
- `src/features/bom-structure/types/bomBackend.types.ts` (`BomExtractionExecutePayload`)
- `src/features/bom-structure/mappers/bomMapper.ts` (`mapBomExtractionStatus`, `mapBomExtractionResult` with strict shape + import-ID checks)
- `src/features/bom-structure/api/bomApi.ts` (`extractToProduction` takes the typed payload)
- `src/features/bom-structure/repositories/bomRepository.ts` (`getExtractionStatus`, `extractToProduction`; contract-rejection messages surface verbatim, permission errors stay mapped)
- `src/features/bom-structure/queries/usePersistedBom.ts`, `queries/bomKeys.ts` (`useBomExtractionStatus`, `extractionStatus` key)
- `src/features/bom-structure/hooks/useBomExtraction.ts` (stable per-intent request ID, targeted invalidation)
- `src/features/bom-structure/components/BomExtractionPreview.tsx` (full execute flow)
- `src/features/bom-structure/bomPipeline.ts`, `components/BomPipelineProgress.tsx`, `bomPipeline.test.mjs`
- `src/features/bom-structure/bomRecovery.ts`, `bomRecovery.test.mjs`
- `src/features/bom-structure/hooks/useBomUnsavedGuard.ts`
- `src/features/bom-structure/components/BomTree.tsx` (windowing + memo rows)
- `src/features/bom-structure/bomTree.ts` (description in search)
- `src/features/bom-structure/BomStructurePage.tsx`, `BomStructurePage.css` (wiring, stable callbacks, match counts, styles)
- `src/types/database.ts`, `src/features/bom-structure/types/bomDomain.types.ts` (pre-existing local scaffolding: new RPC signatures, `bom_extraction` source, `BomProductionExtractionResult`)

## Validation

- `npm.cmd run typecheck` — passed.
- `npm.cmd run build` — passed (only the pre-existing Vite large-chunk advisory).
- `node --test` on `bomPipeline`, `bomRecovery`, `useBomNodeSave`, `bomReplaceGuard`, `descriptionDimensions` — 22 tests passed.
- `git diff --check` — passed.
- No live BOM/Production data was created or modified; no E2E against the live project was run (it still needs a real test import).

## Security / Performance

- Extraction RPCs are `SECURITY INVOKER` with in-function role checks; `bom_audit` tables deny anon/public, grant minimal authenticated select/insert; no `service_role` in frontend; no public bucket.
- Duplicate-article conflicts abort before any write; the unique `(lot_id, article)` constraint remains the concurrency guard.
- Tree renders at most 400 mounted rows per slice with memoized rows; extraction/preview queries stay paginated; invalidation is scoped to `bom` + `productionKeys.all`.

## Remaining Notes

- The extraction migration is checked in but must be applied to project `gsiibqwmoqtamruilvec` and verified there (ledger tables, both RPCs, enum value) before first real extraction; regenerate `database.ts` afterwards if it drifts.
- `delete_bom_import` on an already-extracted import will now fail atomically via the node-immutability trigger — intended per contract, but the delete dialog does not yet explain it.
- `useBlocker` uses a native `confirm()` dialog; a designed confirmation modal is future polish.
- No server-side persisted-tree search yet; client-side search covers the loaded tree only.

## Next Task

Task 70 — Add Filters (level, item type, source type, leaf-only, reused-only, warnings-only, unmapped dimensions).
