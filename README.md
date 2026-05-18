# Mihad Web

Status: Active
Last reviewed: 2026-05-18

Web client for the Mihad activation deal platform. Built with Next.js 15, React
19, TypeScript, Tailwind, next-intl, and Supabase SSR auth.

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

Public front-door lane:

`Prefab Fieldbook -> Prefab AI Calculator -> Planning Result -> Optional Activation Workspace`

Authenticated activation lane:

`Mandate -> Land Sourcing -> Land Option -> Prefab Estimate -> Spread Underwriting -> Deal Pipeline -> Approval-Gated Execution`

Persistence backing lane:

`Buyer Mandate -> RFQ -> Activation Opportunity -> Source Run -> Sourced Option -> Match -> Approval Gate -> Deal Event`

The homepage should not be a chat-first or SaaS-first surface. It should help
people read prefab concepts, browse modular models, and estimate cost, timeline,
site readiness, and supplier fit before any partner outreach. The main CTA is:

- `احسب مشروعك الجاهز` / `Estimate your prefab project`

Supporting paths:

- `دليل مهاد` / `Prefab Fieldbook`
- `قارن الموردين` / `Compare suppliers`
- `أحتاج أرض مناسبة` / `Find land for this concept`

Anonymous users may calculate a project and draft a project brief. Signup is required before durable workspace
creation, browser sourcing, saved options, uploads, supplier/broker/landowner
contact, and approval-gated execution.

## Main Areas

- Prefab Fieldbook article pages
- public Prefab AI Calculator
- calculator-to-project-brief journey for tenants/investors, landowners, and modular suppliers
- authenticated Activation Deal Workspace
- land options board and ranked option cards
- activation land sourcing through operator-controlled browser workers
- direct represented inventory and supplier catalog fetches
- prefab estimate and spread underwriting
- activation pipeline actions and approval gates
- files, notes, and agent-assisted workspace support
- settings, billing, and subscription UI
- web-side backend service code under `services/zohal-backend/`

## Localization

Arabic is the default language for Mihad public and buyer-facing product
surfaces. The tone should be Saudi business-casual: professional, clear,
practical, and familiar without becoming chatty or slang-heavy. English mirrors
the Arabic product intent as the secondary locale.

Implementation rules:

- `NEXT_LOCALE=ar` is the default when the user has not explicitly selected a
  language.
- The language switcher must remain visible on public prefab calculator and Fieldbook pages.
- Do not add user-facing English-only strings. Add Arabic and English together,
  with Arabic treated as the source copy for Saudi-facing flows.
- Keep legal/scope disclaimers precise in both languages, especially around
  supplier verification, permits, pricing, delivery, and Mihad not being a
  contractor or permit issuer.

## Activation Backend Lane

Product-facing Mihad APIs:

- `POST /api/mihad/v1/activation-mandates`
- `POST /api/mihad/v1/activation-mandates/:id/land-sourcing`
- `GET /api/mihad/v1/activation-mandates/:id/represented-inventory`
- `GET /api/mihad/v1/activation-mandates/:id/supplier-matches`
- `POST /api/mihad/v1/activation-deals/:id/prefab-estimate`
- `POST /api/mihad/v1/activation-deals/:id/spread-underwriting`
- `POST /api/mihad/v1/activation-deals/:id/actions`
- `POST /api/mihad/v1/agent/turn`

The backing API writes to `buyer_mandates`, `rfqs`,
`activation_opportunities`, `source_runs`, `sourced_options`,
`option_sources`, `matches`, `approval_gates`, `agent_threads`,
`agent_events`, and `agent_outbox_messages`.

`source_runs` is product-valid only for activation land sourcing. Represented
inventory and supplier catalog lookup are direct fetches, not source runs.

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
- `../mihad-platform/Documentation/Product/Mihad_Product_Summary.md`
- `../mihad-platform/Documentation/Product/Mihad_Buyer_Workflow.md`
- `../mihad-platform/Documentation/Features/Activation_Land_Sourcing_And_Inventory.md`
- `../mihad-platform/Documentation/Product/Prefab_Estimator_And_Spread_Underwriting.md`
- `../mihad-platform/Documentation/Product/Activation_Deal_Actions_And_Files.md`
- `docs/activation-land-sourcing-runtime.md`
- `docs/mihad-brand-domain-migration-audit.md`

For repo-local workflow rules, read `AGENTS.md`.
