## Tasks 36–39 Complete ✅

### Implemented

- **Task 36 — New import metadata:** Added required Project → Project Number → Lot selection and a confirmation panel for the parsed file, sheet, header row, root code, and stable `bom-parser-v1` parser version. A missing root code or hierarchy selection prevents import creation.
- **Task 37 — Create import mutation:** An explicit button starts a TanStack Query mutation after local parsing. It calls `create_bom_import` once per in-session attempt and uses the returned import ID for subsequent steps. Parsing by itself performs no database write.
- **Task 38 — Source file upload:** The original `.xlsx` or `.xls` file uploads to the private `bom-imports` bucket at `{importId}/{safeFileName}`. The client checks extension, matching MIME type, and the bucket's 25 MB limit. Empty browser MIME values use the canonical type implied by the extension. The UI shows the current upload stage, failures, and a retry action.
- **Task 39 — SHA-256 and attachment:** The client hashes the original `File` with Web Crypto and calls `attach_bom_import_source_file` after upload succeeds. The returned import is checked for the expected bucket, path, original file name, MIME type, size, and digest. An attachment retry skips the completed upload.

### Files / Database Changed

- `src/features/bom-structure/bomSourceFile.ts`
- `src/features/bom-structure/hooks/useBomWorkbook.ts`
- `src/features/bom-structure/hooks/useBomImportPreparation.ts`
- `src/features/bom-structure/components/BomFilePicker.tsx`
- `src/features/bom-structure/components/BomImportPreparation.tsx`
- `src/features/bom-structure/BomStructurePage.tsx`
- `src/features/bom-structure/BomStructurePage.css`
- `src/features/bom-structure/api/bomApi.ts`
- `src/features/bom-structure/repositories/bomRepository.ts`
- `src/features/bom-structure/types/bomBackend.types.ts`
- `src/features/bom-structure/types/bomDomain.types.ts`
- `src/features/bom-structure/mappers/bomMapper.ts`
- `src/features/auth/permissions.ts`
- `src/services/desktop/desktopFiles.ts`
- `src/types/database.ts`
- No database schema or existing data was changed during implementation.

### Validation

- Inspected the live `create_bom_import` and `attach_bom_import_source_file` signatures and behavior. The create payload omits source path fields until upload; the attach RPC requires an existing object.
- Confirmed the live `bom-imports` bucket is private, limited to 25 MB, and accepts the two expected Excel MIME types.
- `npm.cmd run typecheck` passed.
- `npm.cmd run build` passed.
- `git diff --check` passed.
- A live authenticated upload was not run because no user workbook or signed-in UI session was supplied.

### Security / Performance

- Only active Admins and Supervisors see the new import controls. Backend RPC role checks and Storage policies remain authoritative.
- Uploads use the existing publishable-key client with `upsert: false`; no service-role key or public bucket was added.
- The checksum is computed before creating a database record, so missing Web Crypto support cannot leave an import record behind.
- Stage progress is shown; the standard Supabase JavaScript upload API does not expose a byte percentage for this call.

### Remaining Notes

- These tasks prepare and attach the source workbook. The BOM nodes remain unsaved until Tasks 40–43 add payload mapping, backend validation, and atomic node save. The UI marks the structure as pending.
- In-session retries reuse the created import. Recovery after a page reload or an uncertain network response during create/upload belongs to Task 66.

### Next Task

Task 40 — Build Save Payload Mapper
