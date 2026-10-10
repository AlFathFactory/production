# BOM Structure — Tasks 50–53 Report

## Outcome

Tasks 50–53 are implemented. Local workbook previews continue to use frontend-derived calculations, while saved BOMs use the persisted tree, summary, warnings, reuse counts, node details, and rollups. Dimension mappings are now looked up and saved through the BOM backend rather than browser storage.

## Implemented

| Task | Result |
| --- | --- |
| 50 — Local vs persisted calculations | The workspace has an explicit `local-preview` or `persisted` source. A saved import cannot fall back to local parsed calculations while backend data loads. The UI labels which calculation source is shown. |
| 51 — Mapping lookup | The dimension panel calls `get_bom_dimension_mapping` for both preview and persisted nodes. It shows the saved token roles from the backend, including whether the match is code-specific or a shared description fallback. Lookup failure disables editing until retry. |
| 52 — Mapping save | Admins and Supervisors can review token roles, Apply locally, then explicitly Save through `save_bom_dimension_mapping`. The payload includes `token_index`, `token_raw`, `token_value`, and `role`. Duplicate non-unassigned roles and incomplete assignments are rejected locally; the backend remains authoritative. Successful saves invalidate and reload the mapping query. Saved mappings are locked. |
| 53 — No localStorage source | Removed the mapping localStorage read/write helpers and all dimension-panel storage use. Draft/Apply state is in memory only; saved mappings are loaded from the backend after refresh or browser-storage clearing. |

The existing immutable-mapping behavior remains: an existing code/description mapping, or a returned shared fallback, is shown read-only. Operators can inspect saved mappings but cannot save them.

## Main Files

- `src/features/bom-structure/BomStructurePage.tsx`
- `src/features/bom-structure/components/BomDetails.tsx` and `BomDimensionMapper.tsx`
- `src/features/bom-structure/descriptionDimensions.ts` and `descriptionDimensions.test.mjs`
- `src/features/bom-structure/queries/useBomDimensionMapping.ts` and `bomKeys.ts`
- `src/features/bom-structure/repositories/bomRepository.ts`
- `src/features/bom-structure/mappers/bomMapper.ts`
- `src/features/bom-structure/types.ts` and `types/bomBackend.types.ts`, `types/bomDomain.types.ts`

## Verification

- Inspected the live lookup and save RPC definitions read-only. Lookup prefers code + description and otherwise returns a description fallback. Save accepts token assignment objects and returns `saved` or `already_saved`; it enforces role permissions and immutability.
- A read-only query found zero current rows in `bom_dimension_mappings`; no Production data was inserted or changed.
- Node tests cover the token assignment payload, decimal-comma normalization, incomplete assignments, and duplicate roles. Existing node-save consistency tests still pass.
- `npm.cmd run typecheck` passed.
- `npm.cmd run build` passed (existing Vite large-chunk advisory remains).
- `git diff --check` passed.

## Remaining Notes

- An authenticated end-to-end mapping save/reopen could not be exercised without a signed-in user and a real mapping to create. Browser-storage clearing is guaranteed by the removal of storage-based mapping reads/writes, but should also be checked in the signed-in UI.
- A failed or ambiguous save is not automatically retried. The mapping lookup refreshes after the attempt so an externally completed save can appear as locked.
- Replacement, re-import, and version flows are outside Tasks 50–53.

## Next Task

Task 54 — Build the explicit replace flow UI.
