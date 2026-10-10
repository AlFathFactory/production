# BOM Structure — Zero-to-Hero Implementation Plan
## Production Control — Master Continuation Document

> **Purpose**
>
> This file is the single source of truth for continuing the BOM Structure feature across backend, frontend, storage, validation, versioning, extraction, QA, and production rollout.
>
> Any AI model or developer working on this project should read this file first, identify the **current task number**, review completed-task reports, inspect the existing implementation before changing anything, and continue from the next task without redesigning or duplicating already completed work.

---

# 1. Project Context

## Product
**Production Control**

## Frontend stack
- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Supabase JS
- Tauri 2
- One shared web + desktop codebase

## Backend
- Supabase
- PostgreSQL 17
- RLS
- RPC-based business operations
- Storage
- Auth + `app_users`

## Repository
`https://github.com/AlFathFactory/production`

## Current Supabase project
- Name: **Production Control**
- Project ref: `gsiibqwmoqtamruilvec`
- Region: `eu-west-1`

> **Critical safety rule**
>
> Do not mutate the separate Inventory MVP project `fifbsrsuazoztwvzijpx`. It is live and unrelated to this BOM implementation unless explicitly requested.

---

# 2. Main BOM Goal

The BOM Structure module should become a production-grade engineering-data flow:

```text
Excel Workbook
    ↓
Local Parse / Preview
    ↓
Structure Validation
    ↓
BOM Import Record
    ↓
Original File Upload
    ↓
Persist Every BOM Occurrence
    ↓
Warnings / Audit / Versioning
    ↓
Tree Explorer
    ↓
Dimension Mapping
    ↓
Rollups / Reuse / Summary
    ↓
Verified Extraction Preview
    ↓
Explicit Routing Assignment
    ↓
Future Production Extraction
    ↓
Production Items
```

The system must preserve the original BOM structure exactly and must **not deduplicate occurrences** when persisting hierarchy rows.

---

# 3. Golden Rules

1. **Inspect before changing**
   - Read the previous task report.
   - Inspect actual code/schema/functions before modifying them.

2. **Never duplicate completed work**
   - Reuse existing RPCs, views, hooks, repositories, parsers, types, and components.

3. **Backend is authoritative**
   - Frontend validation improves UX.
   - Backend validation decides validity.

4. **No raw Supabase calls inside UI components**
   - Page → Hook → Repository → Supabase.

5. **No `service_role` in browser/Tauri frontend.**

6. **Strict TypeScript**
   - Avoid `any`.
   - Keep DTOs and domain/UI types separate.

7. **Every BOM occurrence is canonical**
   - Repeated codes remain separate rows.
   - Reuse counts and rollups are derived.

8. **Source snapshots are immutable**
   - Raw/Formatted Excel snapshots must not be silently modified.

9. **Version history is preserved**
   - Re-import creates a new version.
   - Replace only corrects the same version.

10. **Production extraction is controlled**
   - BOM save must never silently create Production items.
   - Routing must be explicitly assigned.

11. **Writes must be atomic**
   - No partial import.
   - No partial replace.
   - No half-activated re-import.

12. **Security**
   - RLS + grants + RPC role checks.
   - BOM public views/functions stay `SECURITY INVOKER`.

13. **Storage**
   - Original workbook stored privately.
   - No public BOM bucket.

14. **BOM and Production stay separated**
   - BOM prepares validated engineering data.
   - Production remains its own execution workflow.

---

# 4. Existing Frontend BOM Structure Feature

Current feature root:

```text
src/features/bom-structure
```

Important existing files:

```text
BomStructurePage.css
BomStructurePage.tsx
bomTree.ts
descriptionDimensions.ts
parseBomWorkbook.ts
types.ts
components/
hooks/useBomWorkbook.ts
```

Existing components include:

```text
BomDetails
BomDimensionMapper
BomFilePicker
BomSummary
BomToolbar
BomTree
BomWarnings
RolledUpParts
```

Existing frontend behavior:
- XLSX parsing
- first-sheet parsing
- exact `Stufe` header detection
- stack-based hierarchy building
- code resolution
- quantity parsing
- cumulative quantity calculation
- weight calculation
- raw/formatted row snapshots
- reuse counts
- leaf rollups
- warnings
- dimension mapping UI
- local-only preview

Current limitation:

> The feature is still mainly local/browser state and is not yet fully connected to the completed Supabase BOM backend.

---

# 5. Canonical Frontend BOM Node Model

```ts
BomNode {
  id
  sourceRow
  level
  parentId
  parentCode
  code
  position
  articleType
  itemType
  sourceType
  name
  name2
  drawingNumber
  material

  quantityPerParent
  calculatedCumulativeQuantity
  excelCumulativeQuantity

  positionWeightKg
  rolledWeightKg

  raw
  formattedRaw

  children
  reuseCount
  isLeaf
}
```

Canonical meaning:
- `name`: first description/name field from the workbook
- `name2`: second description/name field
- `description`: normalized searchable/mapping string, explicitly supplied or derived from `name + name2`
- `sourceType`: canonical source/procurement type
- `sourceRow`: Excel row number
- `id`: transient frontend id before save; UUID backend id after save

---

# 6. Existing Backend Status

## Tasks 1–30 are complete

Do not recreate them.

Completed capabilities:
- BOM imports
- hierarchy persistence
- raw/formatted snapshots
- quantity/weight snapshots
- dimension mappings
- role constraints
- project/project number/lot association
- parser metadata
- import RPC
- bulk node save
- tree retrieval
- node details
- reuse counts
- leaf rollups
- summary
- dimension mapping lookup/save
- validation
- warning persistence
- replace/delete
- hardened RLS
- explicit grants
- audit metadata
- search indexes
- hierarchy indexes
- source workbook Storage
- re-import/versioning
- BOM → Production extraction boundary
- backend self-tests
- migration/readiness verification

---

# 7. Backend Tables

## `bom_imports`

Purpose: one persisted BOM version.

Important fields:

```text
id
file_name
status
project_id
project_number_id
lot_id
sheet_name
header_row
root_code
parser_version

source_file_bucket
source_file_path
source_file_name
source_file_mime_type
source_file_size_bytes
source_file_sha256
source_file_uploaded_at

version_group_id
version_number
supersedes_import_id
superseded_by_import_id
activated_at

created_by
updated_by
created_at
updated_at
```

Statuses:

```text
parsed
saved
failed
superseded
```

## `bom_nodes`

Every Excel occurrence is persisted separately.

Canonical fields:

```text
id
bom_import_id
parent_id
level
source_row

code
parent_code
position
article_type
item_type
source_type

name
name2
description

drawing_number
material

quantity_per_parent
calculated_cumulative_quantity
excel_cumulative_quantity
position_weight_kg
rolled_weight_kg

raw_data
formatted_raw_data

created_by
updated_by
created_at
updated_at
```

## `bom_dimension_mappings`

Reusable numeric-token mappings.

Roles:

```text
profile
length
width
height
unassigned
```

Saved mappings are treated as immutable.

## `bom_import_warnings`

Persisted warning snapshots per import.

```text
bom_import_id
warning_index
kind
source_row
message
details
created_by
created_at
```

---

# 8. Backend Views

```text
bom_reuse_counts
bom_rolled_up_leaf_parts
bom_summary
bom_current_versions
bom_production_extraction_candidates
```

All must remain:

```text
security_invoker = true
```

---

# 9. Main BOM RPCs

```text
create_bom_import
insert_bom_nodes_bulk
get_bom_tree
get_bom_node_details
get_bom_dimension_mapping
save_bom_dimension_mapping
validate_bom_import_nodes
replace_bom_import_nodes
delete_bom_import
attach_bom_import_source_file
create_bom_reimport
get_bom_production_extraction_preview
```

Role model:
- Operator: read-only BOM access
- Supervisor: BOM management, no permanent delete
- Admin: full BOM management including permanent delete

All BOM public RPCs are `SECURITY INVOKER`.

---

# 10. Storage

Private bucket:

```text
bom-imports
```

Allowed:
- `.xlsx`
- `.xls`

Maximum size:
- 25 MB

Permissions:
- Active users: read
- Admin/Supervisor: upload/update
- Admin: delete
- anon: denied

---

# 11. BOM Versioning Model

Normal first import:

```text
Version 1
status = saved
```

Re-import begins as:

```text
Version 1 = saved/current
Version 2 = parsed candidate
```

After Version 2 saves successfully:

```text
Version 1 = superseded
Version 2 = saved/current
```

If Version 2 fails, Version 1 remains current.

Never mutate version identity fields after creation.

---

# 12. Replace vs Re-Import

## Replace

Use for same-version correction.

```text
delete old nodes/warnings
↓
validate replacement payload
↓
insert new nodes
↓
persist warnings
↓
status saved
```

Atomic.

## Re-Import

Use for a genuinely new workbook revision.

```text
current saved version
↓
create_bom_reimport
↓
new parsed version
↓
upload new file
↓
validate/save
↓
new version activates
↓
old version superseded
```

---

# 13. BOM → Production Boundary

Current read-only boundary:

```text
bom_production_extraction_candidates
get_bom_production_extraction_preview()
```

Candidate output can include:

```text
article
designation
material
total_quantity
unit_weight_kg
profile
length_value
width_value
height_value
lot_id
drawing_number
source_type
```

Intentional blocker:

```text
routing-assignment-required
```

Allowed production routes:

```text
BEND
NO BEND
ROD
ROLLING
LADDER
OTHER
```

No automatic Production insert should exist until explicit extraction/assignment design is approved.

---

# 14. Frontend Architecture Target

```text
Page
 ↓
Feature Hooks
 ↓
Repository
 ↓
Supabase RPC / Storage / Query
```

Recommended structure:

```text
src/features/bom-structure/
  api/
  components/
  hooks/
  mappers/
  pages/
  repositories/
  types/
  utils/
  validation/
```

Suggested backend-facing files:

```text
api/bomApi.ts
repositories/bomRepository.ts
types/bomBackend.types.ts
types/bomDomain.types.ts
types/bomDto.types.ts
mappers/bomMapper.ts
```

---

# 15. State Separation

Frontend must explicitly distinguish:

```text
LOCAL PARSED BOM
```

from:

```text
PERSISTED BOM
```

Suggested state:

```ts
type BomWorkspaceMode =
  | "empty"
  | "local-preview"
  | "saving"
  | "persisted"
  | "reimport-candidate"
  | "error";
```

---

# 16. Main UI Modes

The final experience must support:

```text
1. Empty State
2. Upload / Parse
3. Local Preview
4. Validation Review
5. Save Import
6. Persisted Structure
7. Re-open Saved Import
8. Replace
9. Re-Import
10. Version History
11. Dimension Mapping
12. Warnings Review
13. Extraction Preview
```

---

# 17. End-to-End User Flows

## New BOM

```text
Open BOM Structure
↓
Choose Project / Project Number / Lot
↓
Choose Excel File
↓
Parse locally
↓
Show summary + warnings + tree
↓
Validate locally
↓
Create BOM Import
↓
Upload original workbook
↓
Attach Storage metadata
↓
Validate backend payload
↓
Bulk save nodes
↓
Reload canonical persisted tree
↓
Show persisted state
```

## Existing BOM

```text
Open BOM Structure
↓
Select saved import/version
↓
Load metadata
↓
Load tree
↓
Load summary
↓
Load warnings
↓
Load reuse counts
↓
Load rollups
↓
Load dimension mappings
```

## Re-Import

```text
Choose current BOM
↓
Re-Import
↓
Select new workbook
↓
Create new version
↓
Upload source file
↓
Parse / validate
↓
Save nodes
↓
New version becomes current
↓
Previous becomes superseded
```

---

# 18. Error Philosophy

Separate errors into:

```text
Parser Error
Validation Error
Storage Error
Persistence Error
Authorization Error
Version Conflict
Network Error
```

Do not collapse everything into `Something went wrong`.

---

# 19. Warning Philosophy

Warnings may not block save.

Examples:
- Excel cumulative differs from calculated cumulative
- missing optional code
- unusual quantity
- unmapped dimension description

Warnings should:
- be visible before save
- be persisted after save
- remain inspectable later

---

# 20. Loading Philosophy

Use granular states:

```text
parse loading
validation loading
upload loading
save loading
tree loading
summary loading
warnings loading
mapping loading
extraction loading
```

Avoid one global spinner for the entire feature.

---

# 21. TanStack Query Keys

Recommended:

```ts
bomKeys = {
  all: ["bom"],
  imports: () => ["bom", "imports"],
  import: (id) => ["bom", "import", id],
  tree: (id) => ["bom", "tree", id],
  summary: (id) => ["bom", "summary", id],
  warnings: (id) => ["bom", "warnings", id],
  reuse: (id) => ["bom", "reuse", id],
  rollups: (id) => ["bom", "rollups", id],
  versions: (groupId) => ["bom", "versions", groupId],
  extraction: (id) => ["bom", "extraction", id],
};
```

After save/replace/re-import/mapping/delete, invalidate only relevant keys.

---

# 22. Save Payload Rules

Never persist transient frontend parent IDs.

Use:

```text
source_row
parent_source_row
```

Backend resolves UUID hierarchy IDs.

Normalize:
- Dates → ISO strings in JSON snapshots
- `undefined` → remove or explicit null
- numeric fields → numbers
- blanks → null where expected

---

# 23. Original Workbook Handling

Recommended sequence:

```text
Create import
↓
Generate deterministic object path
↓
Upload Storage object
↓
Attach source-file metadata
↓
Save nodes
```

Choose one Storage path convention and keep it stable, e.g.:

```text
{bom_import_id}/{safeFileName}
```

or:

```text
{version_group_id}/{version_number}/{safeFileName}
```

---

# 24. SHA-256

Use workbook checksum for:
- integrity
- duplicate detection
- audit

Web can use:

```text
crypto.subtle.digest("SHA-256", fileBuffer)
```

---

# 25. Parser Version

Use stable parser versions such as:

```text
bom-parser-v1
```

If parsing semantics change:

```text
bom-parser-v2
```

Old imports must remain reproducible.

---

# 26. Frontend Permissions

## Operator
Can:
- browse BOM
- inspect tree/details/summary/warnings
- inspect mappings
- inspect extraction preview

Cannot:
- create/import
- save/replace/re-import
- delete
- save mappings

## Supervisor
Can:
- Operator capabilities
- create/import
- upload
- save
- replace
- re-import
- save mappings

Cannot:
- permanent delete

## Admin
Can:
- everything
- permanent delete

Frontend hides unavailable actions; backend stays authoritative.

---

# 27. Performance Rules

Tree may contain thousands of rows.

Take care of:
- memoization
- flattened visible-tree representation
- collapsed-branch rendering
- avoid recursive full-tree recalculation on every keystroke
- virtualization for large datasets
- avoid unnecessary cloning of raw row objects

---

# 28. Tree UI Requirements

Each row should support:

```text
expand/collapse
level indentation
code
name/name2
quantity
cumulative quantity
weight
material
reuse indicator
leaf/assembly indicator
warning indicator
mapped-dimension indicator
```

Node selection opens details.

---

# 29. Details Panel

Show:

```text
Code
Name
Name2
Description
Source Type
Article Type
Item Type
Position
Drawing Number
Material
Quantity / Parent
Calculated Cumulative
Excel Cumulative
Position Weight
Rolled Weight
Source Row
Parent
Raw Row
Formatted Row
```

Raw JSON should not be fully expanded by default.

---

# 30. Current Roadmap Position

Backend tasks:

```text
1–30 ✅ COMPLETE
```

Continue from:

```text
Task 31 — Create BOM Backend Types
```

---

# 31. Frontend / Integration Roadmap

## Task 31 — Create BOM Backend Types

Create strict TypeScript definitions for:
- `BomImportRow`
- `BomNodeRow`
- `BomWarningRow`
- `BomDimensionMappingRow`
- `BomSummaryRow`
- `BomReuseRow`
- `BomRolledUpLeafRow`
- `BomExtractionCandidateRow`
- RPC payloads/responses

Acceptance:
- no `any`
- field names match backend exactly
- DTOs stay separate from UI models

---

## Task 32 — Create BOM Repository Layer

Repository functions:

```text
createImport
uploadSourceFile
attachSourceFile
saveNodes
replaceNodes
createReimport
deleteImport
getTree
getNodeDetails
getWarnings
getSummary
getReuseCounts
getRolledUpParts
getDimensionMapping
saveDimensionMapping
getExtractionPreview
```

Acceptance:
- UI has zero direct Supabase calls

---

## Task 33 — Create BOM Domain Mappers

Map backend DTOs to frontend domain models.

Take care of:
- UUID node IDs
- parent IDs
- `name` / `name2`
- `sourceType`
- numeric conversion
- dates
- warning details

Acceptance:
- snake_case does not leak deeply into presentation components

---

## Task 34 — Add Import Listing Query

Support filters:
- project
- project number
- lot
- status
- current/superseded
- filename/root-code search

Acceptance:
- saved BOMs can be reopened without re-uploading

---

## Task 35 — Add BOM Import Selector UI

UI must show:
- import
- version
- status
- current/superseded state

Acceptance:
- persisted BOM is navigable from UI

---

## Task 36 — Connect New Import Metadata

Before save require/confirm:

```text
Project
Project Number
Lot
File
Sheet
Header Row
Root Code
Parser Version
```

---

## Task 37 — Build Create Import Mutation

Call:

```text
create_bom_import
```

Only after local parse is ready.

Acceptance:
- local parse alone never creates DB records

---

## Task 38 — Add BOM Source File Upload

Upload original workbook to `bom-imports`.

Implement:
- safe path
- extension check
- MIME check
- 25 MB check
- progress/error UI

---

## Task 39 — Add SHA-256 + Source Attachment

Calculate SHA-256 and call:

```text
attach_bom_import_source_file
```

Acceptance:
- metadata references an actual Storage object
- checksum saved

---

## Task 40 — Build Save Payload Mapper

Payload must include:

```text
source_row
parent_source_row
level
code
position
article_type
source_type
name
name2
description
drawing_number
material
quantity_per_parent
calculated_cumulative_quantity
excel_cumulative_quantity
position_weight_kg
rolled_weight_kg
raw_data
formatted_raw_data
item_type
```

Acceptance:
- no transient frontend node IDs in persistence contract

---

## Task 41 — Add Backend Validation Step

Call:

```text
validate_bom_import_nodes
```

Show errors and warnings.

Acceptance:
- errors block save
- warnings are acknowledged but may still allow save

---

## Task 42 — Persist BOM Nodes

Call:

```text
insert_bom_nodes_bulk
```

Acceptance:
- full import saved atomically
- canonical backend data is reloaded after save

---

## Task 43 — Switch Workspace to Persisted State

After save:
- clear unsafe temporary assumptions
- fetch canonical tree
- show saved import/version

Acceptance:
- UI becomes backend-driven

---

## Task 44 — Connect Persisted Tree Query

Use:

```text
get_bom_tree
```

Acceptance:
- page refresh restores hierarchy

---

## Task 45 — Connect Node Details Query

Use:

```text
get_bom_node_details
```

---

## Task 46 — Connect Persisted Warnings

Read:

```text
bom_import_warnings
```

Acceptance:
- warnings survive reload

---

## Task 47 — Connect Summary View

Use:

```text
bom_summary
```

For persisted BOM, backend summary becomes source of truth.

---

## Task 48 — Connect Reuse Counts

Use:

```text
bom_reuse_counts
```

---

## Task 49 — Connect Rolled-Up Parts

Use:

```text
bom_rolled_up_leaf_parts
```

---

## Task 50 — Refactor Local vs Persisted Calculations

Rules:
- local preview → frontend derived calculations
- saved BOM → backend derived views

Acceptance:
- no competing source of truth

---

## Task 51 — Connect Dimension Mapping Lookup

Replace localStorage-first behavior with:

```text
get_bom_dimension_mapping
```

---

## Task 52 — Connect Dimension Mapping Save

Use:

```text
save_bom_dimension_mapping
```

---

## Task 53 — Remove Mapping LocalStorage as Source of Truth

LocalStorage may cache UI state only.

Acceptance:
- clearing browser storage does not delete mappings

---

## Task 54 — Build Replace Flow UI

Explicit action:

```text
Replace Current Import
```

Use:

```text
replace_bom_import_nodes
```

Require confirmation.

---

## Task 55 — Build Re-Import Flow UI

Use:

```text
create_bom_reimport
```

Then:
- upload
- parse
- validate
- save

Previous saved version stays current until success.

---

## Task 56 — Build Version History UI

Display:

```text
Version
Status
File
Created By
Created At
Activated At
Superseded By
```

Old versions are read-only.

---

## Task 57 — Current Version Resolution

Use:

```text
bom_current_versions
```

A parsed candidate may coexist with the saved current version.

UI must not treat parsed candidate as production source.

---

## Task 58 — Add Download Original Workbook

Use signed/private download flow.

Acceptance:
- authorized user can retrieve source file
- bucket stays private

---

## Task 59 — Add Delete Flow UI

Admin only.

Call:

```text
delete_bom_import
```

Require exact destructive confirmation.

---

## Task 60 — Add Extraction Preview

Use:

```text
get_bom_production_extraction_preview
```

Display:
- article
- designation
- dimensions
- material
- quantity
- weight
- blockers

No Production writes.

---

## Task 61 — Build Routing Assignment UI

Allow explicit route assignment per candidate:

```text
BEND
NO BEND
ROD
ROLLING
LADDER
OTHER
```

Frontend/workflow only unless backend extraction persistence is explicitly designed.

---

## Task 62 — Design Production Extraction Command

Before coding decide:
- must all rows have route?
- duplicate article behavior
- lot requirements
- insert vs update
- audit model
- idempotency
- re-extraction behavior
- superseded BOM restrictions
- rollback behavior

Acceptance:
- written approved extraction contract before Production writes

---

## Task 63 — Add Production Extraction Persistence Backend

Only after Task 62 approval.

Expected:
- new RPC
- atomic transaction
- audit link to BOM version
- no accidental duplicate extraction
- RLS/grants
- tests

---

## Task 64 — Connect Final Extraction UI

Call future extraction RPC.

Acceptance:
- complete BOM → Production flow
- success summary
- created/skipped rows clearly reported

---

## Task 65 — Add Import Progress UX

Stages:

```text
Parsing
Validating
Creating Import
Uploading File
Attaching Metadata
Saving Structure
Refreshing Data
Complete
```

No ambiguous spinner.

---

## Task 66 — Add Robust Error Recovery

Handle:
- import record created but upload failed
- upload succeeded but attach failed
- attach succeeded but save failed
- retry after network failure
- version conflict

Acceptance:
- user can recover without corrupting DB state

---

## Task 67 — Add Unsaved Changes Guard

Warn before leaving:
- local preview
- unsaved mapping work
- re-import candidate

Cover browser route changes and Tauri close where practical.

---

## Task 68 — Add Large BOM Rendering Optimization

Profile large trees.

Potential:
- virtualization
- memoized flattened tree
- incremental branch rendering

---

## Task 69 — Add Persisted Tree Search

Search:
- code
- name
- name2
- description
- material
- drawing number

Use backend text indexes when server-side search is needed.

---

## Task 70 — Add Filters

Suggested filters:
- level
- item type
- source type
- leaf only
- reused only
- warnings only
- unmapped dimensions

---

## Task 71 — Add Deep Link / URL State

Persist useful context:
- import id
- selected node
- selected tab
- filters where useful

Acceptance:
- refresh preserves context

---

## Task 72 — Add Empty / Loading / Error States

Every major panel handles:

```text
loading
empty
error
success
```

---

## Task 73 — Add Responsive Review

Check:
- desktop
- laptop
- tablet width
- narrow browser

Do not destroy dense-tree usability.

---

## Task 74 — Tauri Desktop Review

Verify:
- file picker
- upload
- hashing
- download
- auth persistence
- navigation
- Storage access

---

## Task 75 — Add Frontend Unit Tests

Test:
- parser helpers
- DTO/domain mappers
- payload builder
- version-state helpers
- permission helpers

---

## Task 76 — Add Component Tests

Test:
- file picker
- warning panel
- tree
- details panel
- dimension mapper
- version history
- extraction preview

---

## Task 77 — Add Integration Tests

Test:
- new import
- validation failure
- save
- replace
- re-import
- mapping
- delete permissions
- extraction preview

---

## Task 78 — Add E2E Happy Path

```text
login
→ select hierarchy
→ upload BOM
→ parse
→ validate
→ save
→ reload
→ inspect tree
→ map dimensions
→ re-import
→ extraction preview
```

---

## Task 79 — Add Permission E2E Tests

Cover:
- Operator
- Supervisor
- Admin

---

## Task 80 — Add Performance Test Dataset

Safe BOM sizes:

```text
100 rows
1,000 rows
5,000 rows
10,000 rows
```

Measure:
- parse
- validation
- save
- tree render
- search
- branch expand

---

## Task 81 — Add Observability

Track frontend errors around:
- parser
- upload
- RPC
- version conflict

Do not log sensitive raw workbook data unnecessarily.

---

## Task 82 — Add User Audit Visibility

Where useful show:
- imported by
- created at
- updated by
- activated at

---

## Task 83 — Centralize BOM Settings / Constants

Centralize:

```text
parserVersion
maxFileSize
allowedExtensions
allowedMimeTypes
query stale times
tree thresholds
```

---

## Task 84 — Remove Legacy BOM Frontend Paths

After backend integration:
- remove duplicate local persistence
- remove obsolete types
- remove dead localStorage source-of-truth logic
- remove old API attempts

---

## Task 85 — Final Data Contract Audit

Compare:
- frontend DTOs
- backend arguments
- table columns
- RPC returns
- view returns

Acceptance:
- zero naming/shape mismatches

---

## Task 86 — Final Security Review

Verify:
- anon denied
- Operator read-only
- Supervisor management allowed
- Admin delete
- Storage private
- no service-role client usage
- no SECURITY DEFINER BOM API

---

## Task 87 — Final Performance Review

Review:
- query counts
- repeated requests
- cache invalidation
- large tree rendering
- indexes
- N+1 details requests

---

## Task 88 — Final Accessibility Review

Verify:
- keyboard behavior where practical
- focus handling
- labels
- modal accessibility
- status is not communicated by color alone

---

## Task 89 — Production Readiness Checklist

Must pass:
- build
- lint
- TypeScript
- unit tests
- integration tests
- E2E
- desktop build
- Supabase advisor review
- no test data
- no debug logs
- migration consistency

---

## Task 90 — Release BOM Structure v1

Release criteria:
- persisted BOM works
- reload works
- versioning works
- permissions work
- mappings work
- source workbook retained
- warnings retained
- extraction preview works
- tests pass

---

# 32. Future Optional Phase

Not required for core BOM v1.

Possible future work:

```text
BOM comparison between versions
Diff highlighting
Engineering change notes
Approval workflow
Mapping templates
Automatic routing suggestions
Material catalog linking
Drawing attachment linking
BOM export
PDF BOM report
Bulk production extraction
Partial extraction
Production traceability back to BOM occurrence
```

---

# 33. BOM Version Diff — Future

Potential diff dimensions:

```text
added codes
removed codes
changed quantity
changed material
changed dimensions
changed weight
changed parent
moved hierarchy position
```

Never compare versions using only row number.

---

# 34. AI Continuation Protocol

Every AI model continuing this project must:

```text
1. Read this entire file.
2. Identify latest completed task.
3. Read the latest implementation report.
4. Inspect actual code/schema before editing.
5. Apply exactly one requested task unless user asks for more.
6. Preserve existing architecture.
7. Do not recreate completed backend work.
8. Do not mutate Inventory MVP.
9. Run relevant tests/checks after implementation.
10. Report:
   - Task number
   - Files/schema changed
   - What was implemented
   - Tests/checks
   - Remaining limitation
   - Next task
```

---

# 35. Required Task Completion Report Format

```md
## Task XX Complete ✅

### Implemented
- ...

### Files / Database Changed
- ...

### Validation
- ...

### Security / Performance
- ...

### Remaining Notes
- ...

### Next Task
Task XX+1 — ...
```

---

# 36. No-Go Decisions

Do not do these without explicit approval:

```text
Do not auto-create Production items during BOM save.
Do not silently guess routing.
Do not delete previous versions during re-import.
Do not deduplicate BOM occurrences.
Do not make source workbook public.
Do not write raw Supabase calls inside UI components.
Do not keep mappings only in localStorage.
Do not persist transient frontend parent IDs.
Do not bypass backend validation.
Do not use service_role in frontend.
```

---

# 37. Definition of Done — BOM v1

BOM Structure v1 is complete when:

```text
Excel upload works
Local parse works
Local preview works
Backend validation works
Original workbook is stored
BOM imports persist
Every occurrence persists
Tree reloads from backend
Warnings persist
Summary persists
Reuse counts persist
Rollups persist
Dimension mappings persist
Replace works
Re-import/versioning works
Old versions remain inspectable
Permissions work
Extraction preview works
No accidental Production writes
Web works
Tauri works
Tests pass
Performance is acceptable
Security is reviewed
```

---

# 38. Current Exact Position

```text
Backend Tasks 1–30 ✅ COMPLETE
```

Next task:

```text
Task 31 — Create BOM Backend Types
```

Implementation should continue from **Task 31**, not from backend schema design.

---

# 39. Final Architecture Summary

```text
                    ┌──────────────────────────┐
                    │       Excel Workbook     │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   Frontend XLSX Parser   │
                    │   Local Preview State    │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ Backend Validation RPC   │
                    └─────────────┬────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
       ┌────────────────────┐          ┌────────────────────┐
       │   BOM Import Row   │          │ Private File Store │
       │   Version Metadata │          │    bom-imports     │
       └──────────┬─────────┘          └────────────────────┘
                  │
                  ▼
       ┌────────────────────┐
       │     BOM Nodes      │
       │ every occurrence  │
       └──────────┬─────────┘
                  │
      ┌───────────┼─────────────┬─────────────────┐
      ▼           ▼             ▼                 ▼
  Warnings     Summary      Reuse Counts      Leaf Rollups
      │                                             │
      └──────────────────┬──────────────────────────┘
                         ▼
                Dimension Mapping
                         │
                         ▼
             Extraction Preview Boundary
                         │
                         ▼
               Explicit Routing Assignment
                         │
                         ▼
                  Future Extraction RPC
                         │
                         ▼
                   Production Items
```

---

# 40. Final Principle

The BOM module is not just an Excel viewer.

It is a controlled engineering-data pipeline:

```text
Source File
→ Reproducible Parse
→ Verified Structure
→ Immutable Snapshot
→ Version History
→ Shared Mapping Knowledge
→ Controlled Production Boundary
```

Every future task should strengthen that pipeline rather than bypass it.
