# BOM Structure — Tasks 54–61 Report

## Outcome

Tasks 54–61 are implemented in the frontend. Version actions still follow Page → hook/repository → API → Supabase. No database schema, RLS, Storage policy, or Production extraction command was changed.

## Implemented

| Task | Result |
| --- | --- |
| 54 — Replace | “Replace Current Import” is available only for the resolved current saved version. It privately downloads and verifies that import’s attached original workbook, parses it locally, validates the exact node payload, requires typed `REPLACE` confirmation, and calls `replace_bom_import_nodes`. It does not silently use a different file while retaining the old source metadata. |
| 55 — Re-import | “Re-Import” starts a new workbook preparation from the current saved version. `create_bom_reimport` creates the candidate, then the existing private upload, attachment, backend validation, and save flow runs. The UI identifies the candidate as inactive until saved; the previous saved version remains current during preparation. |
| 56 — Version history | Displays version, status, source file, creator (name where readable, otherwise auth user ID), creation time, activation time, and superseding version. Superseded versions can be inspected but not replaced, re-imported, or edited through dimension mapping. |
| 57 — Current version | Resolves through `bom_current_versions` with `status = saved`. A coexisting parsed candidate is never labeled or used as the Production source. |
| 58 — Original workbook | Authenticated private-bucket download is available for imports with attached source metadata. Web uses a local Blob download; desktop uses a Save As dialog and filesystem write. No public URL is created. |
| 59 — Delete | Active Admins alone see the delete action. It requires exact `DELETE` input and calls `delete_bom_import`, then refreshes BOM queries and clears selection. |
| 60 — Extraction preview | The current saved import can show the paginated `get_bom_production_extraction_preview` output: article, designation, profile/length/width/height, material, quantity, weight, and blockers. It makes no Production writes. |
| 61 — Route assignment | Each preview candidate has an explicit BEND, NO BEND, ROD, ROLLING, LADDER, or OTHER choice. Assignments are in-memory UI state only and are discarded when the preview closes; they are not persisted or submitted for extraction. |

Replacement and save share the existing locked validated payload and backend-warning acknowledgment checks. Ambiguous save responses are not automatically retried; the UI asks the user to reopen the import before retrying.

## Files Changed

- `src/features/bom-structure/BomStructurePage.tsx` and `.css`
- `src/features/bom-structure/components/BomImportPreparation.tsx`, `BomSaveReview.tsx`, `BomVersionHistory.tsx`, `BomExtractionPreview.tsx`
- `src/features/bom-structure/hooks/useBomImportPreparation.ts`, `useBomNodeSave.ts`, `useBomNodeSave.test.mjs`
- `src/features/bom-structure/api/bomApi.ts`, `repositories/bomRepository.ts`, `queries/bomKeys.ts`, `queries/usePersistedBom.ts`
- `src/features/bom-structure/mappers/bomMapper.ts`, `types/bomDomain.types.ts`
- `src/services/desktop/desktopFiles.ts`

## Validation

- `npm.cmd run typecheck` — passed.
- `npm.cmd run build` — passed; the existing Vite large-chunk advisory remains.
- `node --test src/features/bom-structure/hooks/useBomNodeSave.test.mjs` — 7 tests passed, including replacement payload immutability, import-ID isolation, and warning acknowledgment.
- `git diff --check` — passed.
- Read-only live check: zero BOM imports, zero current saved versions, and the `bom-imports` bucket remains private.

## Remaining Notes

- The live project had no BOM imports at inspection time. Authenticated UI and RPC end-to-end behavior therefore still needs a real test import; no Production data was created or modified during this work.
- `delete_bom_import` deletes the import and dependent records, not the private Storage object. Source-file lifecycle cleanup needs a separate explicit design.
- Routing choices are intentionally not persisted. Task 62 must define the extraction contract before any Production write is added.
