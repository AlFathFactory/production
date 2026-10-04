# Production Control

Production Control runs from the same React + TypeScript + Vite frontend on the web and in a Tauri 2 Windows desktop shell. Both targets use the existing Supabase backend.

## Environment

Copy `.env.example` to `.env.local` and set the frontend-safe values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Only a Supabase publishable/anon key belongs in the frontend. Never add a `service_role` key, database password, or other private secret.

## Web development

```powershell
npm install
npm run dev
npm run typecheck
npm run build
```

## Windows desktop development

Install Node.js 22+, Rust with the stable MSVC toolchain, Microsoft C++ Build Tools with the **Desktop development with C++** workload, and Microsoft Edge WebView2 Runtime. WebView2 is already present on current Windows 10 and Windows 11 installations in most cases.

```powershell
npm install
npm run tauri:dev
npm run tauri:build
```

`tauri:dev` starts the existing Vite application on the desktop development port. `tauri:build` runs the normal web build first and creates the Windows executable and NSIS installer under `src-tauri/target/release`.
