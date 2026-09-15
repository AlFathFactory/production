# Production Control — Frontend Engineering Guide

## Purpose

This file is the engineering contract for any AI agent or developer working on the **Production Control** frontend.

The goal is to build a maintainable, high-performance, production-ready application with the quality expected from a senior frontend engineer, while **avoiding unnecessary abstraction and over-engineering**.

The application will run as:

- Web app: React + Vite + TypeScript
- Desktop app: the same frontend inside Tauri 2
- Backend: Supabase
- Future desktop offline layer: SQLite + sync, introduced only when needed

The frontend must remain one codebase for both web and desktop.

---

## 1. Core Engineering Principles

### 1.1 Keep it simple

Prefer the simplest design that cleanly solves the current requirement.

Do not add generic frameworks inside the app, complex dependency injection, unnecessary factories, unnecessary global state, abstractions used only once, premature offline architecture, unnecessary wrappers around stable libraries, huge utility layers, or deeply nested folder structures without real benefit.

Before creating an abstraction, ask:

> Is this reused now, clearly reusable soon, or necessary to isolate an external dependency?

If not, keep the code local and simple.

### 1.2 Single Responsibility

Every module should have one clear reason to change.

- a page coordinates page-level UI and data
- a hook owns reusable UI/data behavior
- a service talks to an external system
- a repository handles data access
- a component renders one reusable UI concern
- a utility performs one deterministic transformation
- a schema validates one type of input

Avoid files that fetch data, transform data, manage modal state, render hundreds of lines of JSX, and contain unrelated helpers all at once.

### 1.3 Small files, not fragmented files

Small modules are preferred, but do not create one file per trivial function.

Guideline:

- React component: usually under 150–200 lines
- page: usually under 250 lines
- hook: usually under 120 lines
- service/repository module: usually under 200 lines
- utility module: focused on one domain

If a file becomes hard to scan, split by responsibility. Do not split only to satisfy a line count.

### 1.4 Prefer composition over duplication

Repeated UI should become reusable components when the pattern is stable.

Good candidates include Button, Input, Select, Textarea, Modal, ConfirmDialog, DataTable, StatusBadge, PageHeader, MetricCard, EmptyState, ErrorState, LoadingState, SearchInput, FilterBar, and FormField.

Do not create a generic component after seeing a pattern once. A useful rule is: first use, implement clearly; second similar use, compare; third repeated use, extract the stable shared component unless the pattern is obviously reusable earlier.

---

## 2. Technology Stack

Use React, TypeScript, Vite, React Router, TanStack Query, Supabase JS, Tailwind CSS if selected for this project, XLSX only where Excel parsing is required, and Tauri 2 for desktop packaging.

Do not add another dependency when the existing stack already solves the problem well. Every new dependency must have a clear reason.

---

## 3. Recommended Source Structure

Use a practical feature-oriented architecture:

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers/
├── components/
│   ├── ui/
│   └── shared/
├── features/
│   ├── auth/
│   ├── projects/
│   ├── production/
│   ├── imports/
│   ├── bending/
│   ├── documents/
│   ├── dashboard/
│   └── users/
├── repositories/
│   ├── contracts.ts
│   ├── index.ts
│   └── supabase/
├── services/
│   ├── supabase/
│   └── desktop/
├── hooks/
├── lib/
├── config/
│   ├── env.ts
│   └── platform.ts
├── types/
└── main.tsx
```

Do not create empty folders in advance. Create folders only when the related code exists.

---

## 4. Feature Folder Pattern

A feature may contain:

```text
features/production/
├── components/
├── hooks/
├── queries/
├── mutations/
├── schemas/
├── types.ts
└── utils/
```

Only create the folders needed by that feature. Pages should mostly coordinate existing pieces rather than contain all business logic.

---

## 5. React Component Rules

Use functional React components. Prefer named functions for major components.

A component should primarily receive props, render UI, and emit user actions. Move complex data access and business logic into hooks, repositories, or services.

Keep props explicit and strongly typed. Avoid `any`. Avoid passing huge objects when a component only needs two values. Avoid prop drilling through many layers; use feature-level composition or context only when justified.

Build reusable components for stable visual patterns, but avoid oversized "do everything" components such as UniversalFormControl, UniversalPage, or MegaTable.

---

## 6. State Management

Use the least powerful tool that solves the state problem.

- Local UI state: `useState` or `useReducer`
- Server state: TanStack Query
- Global state: only if multiple distant parts of the app truly need synchronized client-only state

Do not add Redux or Zustand by default. Do not duplicate Supabase server state into global client state.

---

## 7. Data Access Architecture

UI components should not contain raw Supabase queries.

Prefer:

```text
Page
↓
query hook
↓
repository
↓
Supabase
```

For example, `useProductionItems()` should call `productionRepository.listItems(...)`.

This keeps the UI independent from the storage implementation and prepares the project for the future desktop SQLite layer.

---

## 8. Repository Boundary

Create focused repository contracts for important business domains such as AuthRepository, ProjectsRepository, ProductionRepository, BendingRepository, DocumentsRepository, UsersRepository, and DashboardRepository.

Do not create one enormous repository. Do not build repositories for trivial one-off helpers.

The repository layer should call Supabase, map database errors, return typed results, and isolate backend-specific syntax. It should not contain UI logic.

---

## 9. Supabase Rules

The Supabase backend is the source of truth.

Never duplicate important backend validation only in the frontend. Frontend validation improves UX; database validation protects correctness.

Use the existing RPCs for workflow-sensitive actions such as:

```text
add_production_stage_entry
create_bending_dispatch
create_bending_return
import_production_preparation_file
correct_production_stage_entry
delete_production_stage_entry
search_production_items
```

Do not bypass these RPCs with direct table writes unless the database design explicitly requires it.

Never expose or bundle the Supabase service-role key. Only frontend-safe project configuration may exist in the client.

---

## 10. Query and Mutation Conventions

Create focused query hooks such as `useProjects`, `useProjectNumbers`, `useLots`, `useProductionItems`, `useProductionDashboard`, and `useProductionDocuments`.

Use stable query keys, for example:

```ts
['production-items', lotId, filters]
```

Do not use vague keys like `['data']`.

Use mutation hooks for important actions such as `useAddProductionStage`, `useCreateBendingDispatch`, `useCreateBendingReturn`, and `useImportProductionFile`.

After mutations, invalidate only affected queries. Do not refetch the entire application. Show useful success/error feedback.

---

## 11. Performance Rules

Optimize based on real cost, not fear.

Always prefer scoped query keys, avoid unnecessary requests, paginate genuinely large lists, debounce text search that hits the server, lazy-load large routes/features when useful, and keep desktop-only code out of the web bundle using dynamic imports.

Do not automatically wrap every component in `memo`, every function in `useCallback`, or every value in `useMemo`. Use them only when they prevent obvious or measurable unnecessary work.

---

## 12. Table Performance

Production tables can become large.

Use server-side filtering when possible, server-side pagination for large datasets, stable row keys, and simple cell components. Do not load thousands of rows only to filter them in JavaScript. Consider virtualization only when needed; do not add it prematurely.

---

## 13. Forms

Keep form state simple. Separate validation schemas when forms become non-trivial.

Validate required fields, numeric ranges, obvious route restrictions, and date formatting in the frontend for user experience, but remember that backend rules remain authoritative.

Translate Supabase errors into understandable user messages.

---

## 14. Error Handling

Never silently fail.

Every async operation must have a defined loading, success, empty, and error state where appropriate. Use reusable error and empty-state components. Do not expose raw database internals to end users when a clearer message is possible.

---

## 15. Loading UX

Avoid flashing entire pages during small background refetches.

Prefer skeletons for initial loading, inline spinners for actions, disabled submit buttons while submitting, and preserving previous table data during filter transitions when appropriate.

---

## 16. Accessibility

Every interactive element must be keyboard accessible.

Use semantic HTML. Buttons use `<button>`, inputs have labels, dialogs have accessible titles, icon-only buttons have accessible labels, focus should move sensibly when dialogs open/close, and color must not be the only status indicator.

---

## 17. Styling Rules

Keep styling consistent. Use shared design tokens or Tailwind patterns for spacing, radius, typography, borders, and status colors.

Do not copy long class lists throughout the project if the exact pattern repeats frequently. Do not create an abstraction for every small class combination.

---

## 18. Naming

Names must explain intent.

Good examples: `CreateBendingDispatchDialog`, `ProductionStatusBadge`, `useProductionItems`, `formatQuantity`.

Bad examples: `Thing`, `DataComponent`, `handleStuff`, `utils2`, `temp`.

Boolean names should read naturally: `isLoading`, `isActive`, `canEdit`, `hasPdf`.

---

## 19. TypeScript Rules

Use strict TypeScript. Avoid `any` and `as unknown as` unless there is a justified boundary.

Prefer explicit domain types, discriminated unions when useful, generated/declared Supabase database types, and narrow types at boundaries. Validate unknown external data before trusting it.

---

## 20. Platform Boundary — Web vs Tauri

The UI must not directly care whether it runs in web or desktop unless the behavior is genuinely platform-specific.

Create `src/config/platform.ts` with a small API such as `getRuntime()`, `isDesktopRuntime()`, and `isWebRuntime()`.

Do not call Tauri runtime detection throughout the app.

---

## 21. Desktop Architecture

Follow the successful Inventory MVP direction: the same React codebase runs on web and inside Tauri.

Do not add the full offline sync engine before the online desktop application is stable.

Desktop-only modules must be dynamically imported where practical so they do not increase the normal web bundle unnecessarily.

---

## 22. Excel Import Rules

Separate file selection, Excel parsing, normalization, validation, preview, and server import.

Do not put the full import workflow into one component.

Normalize Preparation Excel rows into the contract expected by `import_production_preparation_file(...)`.

Do not create production records directly from parsed Excel using many client-side insert calls.

---

## 23. PDF / Documents

Keep document generation separated from storage upload:

```text
document model
↓
PDF generator
↓
storage uploader
↓
database path update
```

Do not mix PDF layout code with Supabase queries in the same module.

---

## 24. Authentication

Authentication concerns should be centralized under the auth feature.

The app should resolve the Supabase session, load the `app_users` profile, then route the user.

Do not hardcode role decisions in many components. Create simple permission helpers such as `canManageUsers(role)`, `canCreateBendingDocuments(role)`, and `canCorrectProduction(role)`.

---

## 25. Role-Based UI

Backend RLS/RPC rules are the real security. Frontend role checks are for UX only.

Hide or disable actions users cannot perform. Do not assume hidden buttons equal security.

---

## 26. Testing Strategy

Do not chase 100% coverage.

Prioritize pure transformation functions, Excel normalization, permission helpers, important hooks, workflow-sensitive UI, and critical page flows.

Test user-observable behavior rather than implementation details.

---

## 27. Clean Code Rules

Avoid commented dead code, unused imports, unexplained TODOs, giant functions, duplicated constants, magic strings, magic numbers, and deeply nested conditions.

Prefer early returns and readable code over clever code.

---

## 28. Constants and Enums

Centralize stable domain values when reused, such as production routes, stages, user roles, document types, and progress states.

Do not create one giant constants file for every string in the app. Keep constants near the domain that owns them.

---

## 29. Comments

Comments should explain why, not what.

Prefer self-explanatory code over excessive comments.

---

## 30. API / Database Types

Create or generate typed database definitions. Do not manually redefine the same database row type in many places.

Keep UI-specific view models separate from raw database row types when needed.

---

## 31. Avoid Rewriting the Same Code

Before implementing new UI:

1. search existing shared components
2. search existing feature components
3. search hooks and utilities
4. reuse when behavior is genuinely equivalent

Do not copy/paste a component and rename it. If two components share most of their behavior, evaluate extracting the stable common part.

Do not force unrelated components into one abstraction just because they look similar.

---

## 32. Page Construction Pattern

Pages coordinate. Feature components implement focused behavior. Repositories handle backend access.

Conceptually:

```tsx
export function ProductionPage() {
  const filters = useProductionFilters()
  const query = useProductionItems(filters)

  return (
    <PageLayout>
      <PageHeader />
      <ProductionFilters />
      <ProductionTable />
    </PageLayout>
  )
}
```

---

## 33. Mutation Safety

For workflow-sensitive operations, disable double submit, show pending state, handle server conflicts, and prefer the authoritative server response.

Do not optimistically update complex production totals unless the behavior is clearly safe.

This is especially important for CUT, OUT_BEND, BEND, ROLLING, DISPENSE, Bending Dispatch, Bending Return, and Admin corrections.

---

## 34. Security Rules

Never store service-role credentials in frontend code, bypass RLS intentionally, trust role values only from UI state, build SQL from user-controlled strings, expose sensitive debug output in production, or store raw passwords in app tables.

Use Supabase Auth for authentication and backend RLS/RPC validation for authorization.

---

## 35. Environment Configuration

Create one typed environment module, for example `config/env.ts`, and validate required frontend variables at startup.

Do not access `import.meta.env` throughout the codebase.

---

## 36. Desktop File Access

When native desktop file access is introduced, use the minimum required Tauri capabilities, avoid unrestricted filesystem access, isolate Tauri-specific file APIs behind a service, and expose one feature-level interface to the UI.

---

## 37. Offline Architecture

Do not build offline support until online web + online Tauri are stable.

When offline support is introduced:

- SQLite is a local cache/read model
- Supabase remains source of truth
- queued writes represent business commands, not raw SQL
- server RPCs revalidate every queued operation
- conflicts must be visible to users
- imports/admin corrections remain online-first unless explicitly redesigned

Follow the proven Inventory MVP pattern carefully rather than inventing a second sync model.

---

## 38. Code Review Checklist

Before completing any task, verify:

### Architecture
- [ ] Code is in the correct feature/domain
- [ ] Each file has one clear responsibility
- [ ] No unnecessary abstraction
- [ ] No avoidable duplication

### TypeScript
- [ ] No unnecessary `any`
- [ ] Props/types are explicit
- [ ] External data is typed or validated

### React
- [ ] Server state uses TanStack Query
- [ ] Local state remains local
- [ ] Components are reasonably sized
- [ ] No obvious unnecessary rerenders

### UI
- [ ] Loading state exists
- [ ] Empty state exists where needed
- [ ] Error state exists
- [ ] Disabled/pending action state exists
- [ ] Accessible labels are present

### Backend
- [ ] Existing RPC/view is reused
- [ ] Backend validation is not bypassed
- [ ] Query invalidation is scoped

### Reuse
- [ ] Existing shared component checked before creating another
- [ ] No copy/paste duplicate implementation

### Performance
- [ ] No unnecessary full-table fetch
- [ ] No unnecessary global refetch
- [ ] Search/filter behavior is server-side when appropriate
- [ ] Desktop-only code does not leak into the normal web bundle unnecessarily

### Cleanup
- [ ] No dead code
- [ ] No unused imports
- [ ] No debug console output
- [ ] No unexplained TODOs

---

## 39. AI Agent Working Rules

When an AI agent implements a task:

1. Read this file first.
2. Inspect the existing project before creating new patterns.
3. Reuse existing components/utilities where appropriate.
4. Make the smallest coherent change that fully solves the task.
5. Do not refactor unrelated code.
6. Do not introduce libraries without need.
7. Do not create abstractions for hypothetical future requirements.
8. Preserve existing architecture unless there is a concrete problem.
9. Keep the app buildable after every task.
10. Run type-check/build/tests relevant to the change.
11. Fix errors caused by the task before stopping.
12. Summarize files created, files changed, architectural decisions, tests/build run, and remaining known issues.

---

## 40. Definition of Done

A frontend task is complete only when:

- the requested behavior works
- code is typed
- loading/error/empty states are handled where relevant
- repeated UI is reused appropriately
- backend access follows repository/query conventions
- permissions are respected in UI
- backend validation is not duplicated as the source of truth
- code passes build/type-check
- no unrelated regressions are introduced
- no temporary/debug code remains

---

## Final Engineering Standard

The target is:

> Clean enough for a senior engineer to maintain, simple enough for another developer to understand quickly, modular enough to grow, and practical enough that we do not spend time building architecture the product does not yet need.

Prefer clarity over cleverness.

Prefer stable composition over abstraction.

Prefer reuse over copy/paste.

Prefer server authority over duplicated client business rules.

Prefer one clean implementation over many layers.
