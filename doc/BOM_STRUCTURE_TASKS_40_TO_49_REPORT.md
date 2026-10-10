# BOM Structure — Tasks 40–49 Report

## Outcome

Tasks 40–49 are implemented in the frontend. An attached local workbook can now be validated by the backend, reviewed for errors and warnings, and saved through the atomic bulk-insert RPC. Saved imports reopen from backend data, including after a page refresh using the `bomImportId` URL parameter.

## Implemented

| Task | Result |
| --- | --- |
| 40 — Save payload | Maps every parsed occurrence to the requested snake-case node fields. Parent references use `parent_source_row`, not temporary UI IDs. Empty text becomes `null`; raw dates become ISO strings; non-finite numbers are rejected or normalized in raw snapshots. |
| 41 — Validation | Calls `validate_bom_import_nodes` on an explicit action. Shows backend error and warning lists. Errors block saving; warnings require an acknowledgment checkbox. |
| 42 — Node persistence | Calls `insert_bom_nodes_bulk` only after a successful validation review. The RPC performs its own validation and atomic insert. Response import ID and inserted count are checked. |
| 43 — Persisted workspace | After save, import metadata is invalidated and the UI switches to backend queries. The saved version is displayed; local preview calculations are no longer used for a saved import. |
| 44 — Tree | Loads all pages of `get_bom_tree` and rebuilds parent/child links from persisted UUIDs. A selected saved import is retained in the URL for refresh/reopen. |
| 45 — Details | Clicking a saved node calls `get_bom_node_details`, including its raw and formatted Excel row snapshots. Loading and retry states are shown. |
| 46 — Warnings | Reads `bom_import_warnings` with pagination and displays saved warnings after reload. |
| 47 — Summary | Uses `bom_summary` for a saved import. |
| 48 — Reuse | Uses `bom_reuse_counts` to populate saved-tree reuse badges; no frontend occurrence count is used for persisted nodes. |
| 49 — Rollups | Uses paginated `bom_rolled_up_leaf_parts` for saved leaf totals. |

The local preview still uses the existing parser's derived values until save. The local-only dimension mapper is not shown on persisted node details; backend dimension mapping belongs to later roadmap tasks.

## Main Files

- `src/features/bom-structure/BomStructurePage.tsx` and `.css`
- `src/features/bom-structure/mappers/bomSavePayload.ts`, `bomValidation.ts`, and `bomMapper.ts`
- `src/features/bom-structure/hooks/useBomNodeSave.ts`
- `src/features/bom-structure/queries/usePersistedBom.ts` and `bomKeys.ts`
- `src/features/bom-structure/api/bomApi.ts` and `repositories/bomRepository.ts`
- `src/features/bom-structure/components/BomSaveReview.tsx`, `BomDetails.tsx`, `BomWarnings.tsx`, `BomImportSelector.tsx`, and `RolledUpParts.tsx`

## Verification

- `npm.cmd run typecheck` — passed.
- `npm.cmd run build` — passed (existing Vite large-chunk advisory remains).
- `git diff --check` — passed; Git reported only line-ending notices.
- No authenticated end-to-end save was attempted: no user workbook or signed-in browser session was supplied. The live database was not written to during this work.

## Remaining Notes

- A network failure after the bulk-save request may have an uncertain outcome. The UI asks the user to reopen the import before retrying, avoiding an automatic duplicate write. The backend rejects a second insert into an already saved import.
- This does not add replacement, re-import recovery, version history, or backend dimension editing; those are later roadmap tasks.

## Next Task

Task 50 — Refactor local versus persisted calculations and formalize the source-of-truth boundary.
