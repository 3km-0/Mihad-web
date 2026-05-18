# Mihad Web

Status: Active
Last reviewed: 2026-05-18

Web companion for the Mihad document and activation workflow platform. Built
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

The active buyer workflow lane is:

`Buyer Mandate -> RFQ -> Source Run -> Sourced Option -> Match -> Buyer Packet -> Partner Intro -> Deal Event`

The public prefab posture is:

`Editorial/Gallery Front Door -> Demand Activation Request -> Deterministic Scoring -> Broker/Manager -> Selective Operator`

The homepage should not be a chat-first or SaaS-first surface. It should help
people browse prefab homes, modular buildings, retail pods, project offices,
and land activation ideas. The demand engine remains visible through header and
homepage CTAs for:

- `ابدأ طلبك` / `Start a request`
- `أحتاج موقع تجاري` / `I need a commercial site`
- `عندي أرض` / `I own land`
- `أنا مورد مباني جاهزة` / `I provide modular units`

AI is an optional concierge entry point, not the default landing experience.

Web uses the same product language as iOS and core docs:
- `Living Interface` for public/product language
- `Surface` for internal runtime/delivery language
- `Template` publicly
- `playbook` only for persistence/API details
- `Corpus` for curated source sets

The web app does not expose an end-user Pipeline Builder, deal desk, or legacy
acquisition report lane in the active buyer desk.

## Main Areas

- public editorial/gallery prefab and modular inspiration pages
- three-path activation request flow for tenants, landowners, and modular suppliers
- deterministic activation scoring and broker/operator routing state
- authenticated workspace and buyer/RFQ flows
- Sources / document management
- operator and Ask flows
- settings, billing, and subscription UI
- derived buyer packet and consent-scoped partner sharing
- approval-gated supplier/broker intro actions
- operator RFQ queue, match board, and approval gates
- web-side GCP backend service code under `services/zohal-backend/`

## Localization

Arabic is the default language for Mihad public and buyer-facing product
surfaces. The tone should be Saudi business-casual: professional, clear,
practical, and familiar without becoming chatty or slang-heavy. English mirrors
the Arabic product intent as the secondary locale.

Implementation rules:

- `NEXT_LOCALE=ar` is the default when the user has not explicitly selected a
  language.
- The language switcher must remain visible on public prefab/RFQ pages.
- Do not add user-facing English-only strings. Add Arabic and English together,
  with Arabic treated as the source copy for Saudi buyer flows.
- Keep legal/scope disclaimers precise in both languages, especially around
  supplier verification, permits, pricing, delivery, and Mihad not being a
  contractor or permit issuer.

## Buyer Workflow Backend Lane

`services/zohal-backend` owns the Mihad buyer workflow API:

- `POST /api/mihad/v1/mandates`
- `POST /api/mihad/v1/rfqs`
- `POST /api/mihad/v1/source-runs`
- `POST /api/mihad/v1/source-runs/:runId/execute`
- `POST /api/mihad/v1/sourced-options`
- `POST /api/mihad/v1/buyer-packets`
- `POST /api/mihad/v1/buyer-packets/:packetId/grants`
- `POST /api/mihad/v1/approval-gates`
- `POST /api/mihad/v1/agent/turn`

The API writes to `buyer_mandates`, `rfqs`, `source_runs`, `sourced_options`,
`option_sources`, `matches`, `buyer_packets`, `sharing_grants`, and
`approval_gates`. Raw financial/private documents stay in `documents`; buyer
packets contain derived fields only.

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
