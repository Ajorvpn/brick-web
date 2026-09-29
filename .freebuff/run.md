# brick-web — run doc

## Reproduce artifacts (fresh checkout)

1. Node: use Node 24 LTS (system Node is 18, too old for Next 16).
   A local install exists at `~/tools/node24/bin` — put it on PATH:
   ```bash
   export PATH=~/tools/node24/bin:$PATH
   ```
   (If missing: `mkdir -p ~/tools && curl -sL https://nodejs.org/dist/v24.21.0/node-v24.21.0-linux-x64.tar.xz | tar -xJ -C ~/tools && mv ~/tools/node-v24.21.0-linux-x64 ~/tools/node24`.)

2. No `.env.local` is required — the site is static, backend-free, and holds no secrets. Nothing to copy from the main checkout.

3. Install dependencies with pnpm (packageManager is pinned in root package.json):
   ```bash
   cd "<repo root>"
   pnpm install
   ```

4. Generate Next.js route types (needed for `PageProps<>` + `LayoutProps<>`):
   ```bash
   cd apps/web
   npx next typegen
   ```

## Run the dev server

```bash
export PATH=~/tools/node24/bin:$PATH
cd apps/web
npx next dev -p 4310
```

- Default port choice: 4310 (project default 3000 is commonly occupied by other agents' servers on this machine).
- Detached launch (Linux):
  ```bash
  { nohup npx next dev -p 4310 > "<log>" 2>&1 < /dev/null & echo "pid=$!"; disown; }
  ```
- Verify: `curl -s -o /dev/null -w "%{http_code}" http://localhost:4310/` → expect 200.

## Notes

- Turbopack is the default bundler in Next 16 — no flag needed.
- Run from repo root: `pnpm dev` (turbo), or per-app as above.
- Next telemetry is disabled in this checkout.
