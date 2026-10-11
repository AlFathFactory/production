# BOM Structure — Tasks 70–80 Report

## Outcome

Tasks 70–77 and 80 are implemented in the repository. Tasks 78–79 now have an executable acceptance matrix, but their live execution remains intentionally blocked on dedicated test users and a deployed test BOM/Production dataset; no production records were created for this tranche.

## Implemented

| Task | Result |
| --- | --- |
| 70 — Filters | The structure toolbar supports level, item type, source type, leaf-only, reused-only, warnings-only, and unmapped-dimensions filters. Matching descendants automatically reveal their ancestor path. Dimension coverage uses the current saved import's extraction blockers and is unavailable for local previews or non-current versions rather than making an unsupported claim. |
| 71 — Deep link / URL state | `bomImportId`, selected node, tab, query, and all filter choices round-trip through the URL. Default values are omitted, unrelated route parameters are preserved, and a loaded selected node opens its detail panel with ancestors expanded. |
| 72 — Empty / loading / error states | Existing query, import, pipeline, warning, tree, details, extraction, and retry states are retained. The filtered tree reports an explicit no-match state, and toolbar state is exposed through a live result count. |
| 73 — Responsive review | Filter controls now reflow from a dense desktop grid to two columns and then one column. Narrow views retain the horizontally scrollable dense tree and tab strip instead of collapsing BOM data. |
| 74 — Tauri desktop review | Static review passed: native Excel picker/drop paths, size and extension checks, SHA-256 browser-context hashing, user-directed source download/save, auth browser storage, Supabase CSP endpoints, and required `dialog`, `fs`, and `opener` permissions are present. A packaged-app smoke test is still required before release. |
| 75 — Frontend unit tests | `npm test` covers parser-dimension helpers, save-payload construction, version-state guards, permissions, filters, URL state, recovery, and pipeline state. |
| 76 — Component tests | Existing components were reviewed for semantic loading/empty/error output. Full DOM interaction tests need a browser-test harness (such as Playwright or Testing Library), which the project does not yet include; this is recorded as the E2E harness prerequisite below rather than adding unrun test dependencies. |
| 77 — Integration tests | The save/replace hook integration suite verifies validation-to-save payload identity, warning acknowledgement, import isolation, and no automatic retry on uncertain writes. Repository-backed create/re-import/mapping/delete/extraction runs require the same isolated Supabase environment as E2E. |
| 78 — E2E happy path | See the release-gate matrix below. It covers the complete requested path and is ready to automate once test credentials and a disposable project/lot exist. |
| 79 — Permission E2E | See the role matrix below. UI gates remain covered by permission unit tests; backend authority must be exercised against the isolated Supabase environment. |
| 80 — Performance test dataset | `createBomPerformanceDataset` creates deterministic, synthetic 100/1,000/5,000/10,000-row BOMs, with branch depth, repeated codes, item/source variation, and no customer workbook content. |

## Release-gate matrix

| Flow | Account/data required | Expected result |
| --- | --- | --- |
| Import happy path | Active Supervisor + disposable project, number, lot, workbook | Parse → validate → attach → save → reload tree → map dimensions → re-import → extraction preview succeeds. |
| Operator | Active Operator + saved import | Browse/search/filter/tree/details/version/extraction preview work; file/import/save/replace/re-import/mapping/extract/delete actions are absent or rejected. |
| Supervisor | Active Supervisor + saved current import | Create, save, replace, re-import, and mapping work; permanent delete is unavailable/rejected. |
| Admin | Active Admin + disposable import | Supervisor capabilities plus permanent delete work. |
| Desktop | Packaged Tauri app + same disposable data | Picker, drop, hash, upload, download/save, auth persistence, navigation, and private Storage access work after restart. |
| Performance | Synthetic fixture for each approved size | Record parse, validation, save, initial tree render, text search, and branch-expand timings. Persist only timings and environment metadata, never raw workbook data. |

## Validation

- `npm.cmd test` — 30 tests passed.
- `npm.cmd run typecheck` — passed.
- `npm.cmd run build` — passed (Vite's existing large-chunk advisory may appear).
- `git diff --check` — passed.

## Files added or changed

- `src/features/bom-structure/bomTree.ts`
- `src/features/bom-structure/bomUrlState.ts`
- `src/features/bom-structure/bomPerformanceDataset.ts`
- `src/features/bom-structure/components/BomToolbar.tsx`
- `src/features/bom-structure/BomStructurePage.tsx`
- `src/features/bom-structure/BomStructurePage.css`
- BOM unit/integration test files and `package.json`
