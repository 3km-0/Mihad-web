# Zohal Backend Service

Status: Active
Last reviewed: 2026-05-11

This GCP Cloud Run service owns web-side backend APIs that are no longer
Supabase Edge Function work. It is part of the migration direction toward GCP +
Cloudflare, while Supabase remains the active control plane for auth and
Postgres.

## Acquisition Report Lane

Acquisition Reports are the weekly ranked mandate-matching artifacts for real
estate acquisition users. They provide the share/present/proof URL for a saved
mandate, but they are not an AI-generated UI/code product.

Primary API:

```txt
POST /api/acquisition/v1/workspaces/:workspaceId/acquisition-reports
POST /api/acquisition/v1/acquisition-reports/:reportId/notes
```

Compatibility API:

```txt
POST /api/acquisition/v1/workspaces/:workspaceId/deal-desk
POST /api/acquisition/v1/deal-desk/:reportId/notes
```

Internal weekly orchestration:

```txt
POST /internal/acquisition/reports/weekly
POST /internal/acquisition/report-task
```

## Runtime Contract

- Persistence remains in `acquisition_deal_desk_reports` for v1.
- Public product language is `Acquisition Report`.
- `deal_desk` and `/deal-desk/{surface_key}` remain internal/URL
  compatibility terms.
- Default visibility is `public_unlisted`.
- Default report size is top 5 ranked deals.
- Ranking prefers `investment_score`, then recommendation state and fit score.
- Structured preferences may control `top_n`, hidden sections, density, and
  whether AI analysis sections render.
- Arbitrary AI-generated UI/code is not supported in this lane.

## Scheduling

Weekly generation should fan out through Cloud Tasks using the
`acquisition-report-runs` queue. Reruns must be idempotent for the same
workspace, mandate, period, and artifact kind.

Do not log raw OCR, full deal text, secrets, or private document contents when
report jobs run.

## Verification

Useful checks:

```bash
node --test services/zohal-backend/test/acquisition.test.js
npm --prefix services/zohal-backend run smoke:acquisition-report
```

Remote smoke requires the normal backend and platform runtime secrets.
