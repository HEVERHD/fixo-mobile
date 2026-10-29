# Fixo monorepo

Yarn (v1) workspaces with two apps that share one Supabase project:

- `apps/mobile` — Expo / React Native app. Read `apps/mobile/AGENTS.md` before touching it.
- `apps/web` — Next.js web app (client portal and admin). Read `apps/web/AGENTS.md` before touching it.
- `supabase/migrations` — the only source of truth for the database schema and RLS, used by both apps.

## Rules

- Install from the repo root with `yarn install`; there is a single `yarn.lock` at the root. Never add per-app lockfiles.
- Run tools with `yarn` (`yarn workspace @fixo/mobile …`, or `yarn …` inside an app). `npx` resolves local binaries wrongly inside the workspace and fails.
- Add mobile dependencies with `yarn expo install <pkg>` from `apps/mobile`.
- Both apps must stay on the same `react` version (pinned in the root `resolutions`) and the same `typescript`.
- Run lint and typecheck for every app you changed: `yarn lint` and `yarn typecheck` from the root.
