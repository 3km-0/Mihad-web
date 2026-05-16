# Mihad Web

Status: Active
Last reviewed: 2026-05-11

Web companion for the Mihad document and acquisition workspace platform. Built
with Next.js 15, React 19, TypeScript, Tailwind, next-intl, and Supabase SSR
auth.

## Repo Layout

This is a separate git repository from `mihad-ios/` and `mihad-platform/`.
Commit and push changes inside each repo.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Product Model

The shared product model is:

`Document -> Template -> Run -> Snapshot -> Living Interface -> Automation`

Web uses the same product language as iOS and core docs:
- `Living Interface` for public/product language
- `Surface` for internal runtime/delivery language
- `Template` publicly
- `playbook` only for persistence/API details
- `Corpus` for curated source sets

The web app does not expose an end-user Pipeline Builder during the acquisition
reset.

## Main Areas

- authenticated workspace and property/acquisition flows
- Sources / document management
- operator and Ask flows
- settings, billing, and subscription UI
- Living Interface publication controls for the active `market` family
- Acquisition Report creation and weekly report orchestration through the GCP
  backend
- web-side GCP backend service code under `services/zohal-backend/`

## Acquisition Report Backend Lane

`services/zohal-backend` owns the Acquisition Report API aliases:

- `POST /api/acquisition/v1/workspaces/:workspaceId/acquisition-reports`
- `POST /api/acquisition/v1/acquisition-reports/:reportId/notes`
- compatibility routes under `/deal-desk`
- internal weekly orchestration under `/internal/acquisition/reports/weekly`

The report lane keeps Supabase report records and Cloudflare delivery/proof
URLs, but it is deterministic presentation data, not arbitrary AI-generated UI
code. Default reports are public-unlisted, rank by `investment_score` when
available, and default to the top 5 deals unless structured preferences say
otherwise.

## Commands

```bash
npm run typecheck
npm run build
npm run test:run
```

Run the narrowest useful check after small changes. Run typecheck/build after
substantive web UI or API-contract changes.

## Environment Variables

Local development usually needs:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Before adding new variables, check existing Vercel/Firebase/GCP/Supabase names
and prefer documented aliases over duplicate secrets.

## Documentation

Start with:

- `../mihad-platform/Documentation/README.md`
- `../mihad-platform/Documentation/Architecture/architecture.md`
- `../mihad-platform/Documentation/Templates/Document-Templates.md`
- `../mihad-platform/Documentation/Quality/Agent_E2E_Smoke_Playbook.md`
- `../mihad-platform/Documentation/Surface/README.md`
- `docs/acquisition-playwright-runtime.md`
- `docs/mihad-brand-domain-migration-audit.md`

For repo-local workflow rules, read `AGENTS.md`.
