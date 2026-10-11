# Task 62 — Proposed BOM → Production Extraction Contract

Status: **approved by the user on 2026-10-10** for Tasks 63–64.

This proposal is based on the current read-only extraction preview and live Production schema. The preview groups leaf occurrences by article. `production_items` has a unique `(lot_id, article)` constraint and its current source enum contains only `manual` and `excel_import`; neither should be bypassed or mislabeled.

## Proposed decisions

| Decision | Proposed contract |
| --- | --- |
| Scope | Full extraction of one current, saved BOM version; no partial extraction. Backend recomputes all candidates at execution time. Empty candidate sets are rejected. |
| Routing | Every candidate requires one explicit route from BEND, NO BEND, ROD, ROLLING, LADDER, OTHER. No suggestion or default route. The backend verifies exactly one assignment per candidate and rejects any remaining non-routing blocker. |
| Lot | The BOM import must have a lot, and the lot must still exist under the import's project number. The client cannot override it. |
| Duplicate article | Abort the entire request if a `(lot_id, article)` is already in Production from any other source or BOM version. Do not update, merge, silently skip, or overwrite Production progress. The existing unique constraint remains a final concurrency guard. |
| Insert vs update | Insert new Production items only. Set the source to a new explicit `bom_extraction` enum value; never label them as manual or Excel preparation imports. Existing items are never updated by this command. |
| Audit | Add an extraction ledger keyed uniquely to the BOM import/version, with actor, timestamps, request ID, candidate count, route/payload fingerprint, result counts, and per-candidate links to created Production item IDs. Preserve the BOM version and original source reference. |
| Idempotency | A repeat of the same completed request returns the prior result without new writes. A changed request for an already extracted BOM is rejected. Concurrent calls serialize on the BOM import and are protected by unique constraints. An ambiguous network response must be resolved by querying ledger status before a retry. |
| Re-extraction | No automatic re-extraction after a BOM replacement or re-import. A newer version with articles already present in the same lot conflicts and needs a separately approved reconciliation workflow. |
| Version restrictions | Only the current saved version may extract. Parsed, failed, and superseded versions are rejected. Recheck status and successor under lock in the same transaction. |
| Rollback | Validation, ledger, links, and Production inserts form one database transaction; any failure rolls back all of them. A completed extraction cannot be deleted or have its source BOM nodes replaced, and has no automatic reverse command. |
| Authorization | Active Admin or Supervisor only, checked in the invoker RPC and by RLS/grants. Operator may inspect the preview and audit result but cannot extract. No service-role frontend key. |
| Result | Return explicit `created`, `skipped`, `conflicted`, and `already_extracted` counts/status plus extraction ID. Under this strict policy a successful first extraction has `skipped = 0`; conflicts abort rather than being represented as silent skips. |

## Proposed execution boundary

1. UI obtains the current preview and explicit routes; user confirms the version, lot, and item count.
2. An invoker RPC locks the current BOM import, rechecks role/version/lot, recomputes the candidate set, compares exact assignments, and checks blockers and lot/article conflicts.
3. The RPC inserts the ledger, Production items, and audit links atomically, returning a typed summary. Unique constraints and the ledger ensure concurrency safety.
4. On an uncertain network result, the UI reads the ledger and does not automatically repeat the write.

## Approval gate

The user approved this contract on 2026-10-10. Tasks 63–64 may be implemented under these exact rules; changes to duplicate-article, re-extraction, or rollback behavior need separate approval.
