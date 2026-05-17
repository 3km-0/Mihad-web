# Mihad Backend Service

Status: Active
Last reviewed: 2026-05-17

This GCP Cloud Run service owns web-side backend APIs that are no longer
Supabase Edge Function work. It is part of the migration direction toward GCP +
Cloudflare, while Supabase remains the active control plane for auth and
Postgres.

## Buyer Workflow Lane

The active product lane is:

`Buyer Mandate -> RFQ -> Source Run -> Sourced Option -> Match -> Buyer Packet -> Partner Intro -> Deal Event`

Primary API:

```txt
POST /api/mihad/v1/mandates
GET  /api/mihad/v1/workspaces/:workspaceId/mandate
POST /api/mihad/v1/rfqs
POST /api/mihad/v1/source-runs
POST /api/mihad/v1/source-runs/:runId/execute
POST /api/mihad/v1/sourced-options
POST /api/mihad/v1/sourced-options/:optionId/promote
POST /api/mihad/v1/buyer-packets
POST /api/mihad/v1/buyer-packets/:packetId/grants
POST /api/mihad/v1/sharing-grants/:grantId/revoke
GET  /api/mihad/v1/partners
POST /api/mihad/v1/approval-gates
POST /api/mihad/v1/agent/turn
```

## Runtime Contract

- Persistence uses the reset schema: `buyer_mandates`, `rfqs`, `source_runs`,
  `sourced_options`, `option_sources`, `matches`, `buyer_packets`,
  `sharing_grants`, `approval_gates`, `partners`, and `agent_*`.
- Prefab is the first vertical.
- Every sourced option needs source attribution.
- Buyer packets are derived-only; raw financial/private documents stay in
  `documents`.
- Partner outreach and packet sharing are approval-gated.
- Legacy `/api/acquisition/v1/*` and deal-desk report routes are not exported
  by the service entrypoint.

## Scheduling

Weekly generation should fan out through Cloud Tasks using the
`acquisition-report-runs` queue. Reruns must be idempotent for the same
workspace, mandate, period, and artifact kind.

Do not log raw OCR, full deal text, secrets, or private document contents when
report jobs run.

## Verification

Useful checks:

```bash
npm test
curl -fsS https://zohal-backend-508190035666.me-central2.run.app/status
```

Remote smokes that create rows require the normal backend and platform runtime
secrets plus a valid Supabase user token or internal function token.
