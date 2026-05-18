# Activation Land Sourcing Runtime

Status: Active runtime reference
Last updated: 2026-05-18

This document describes the current browser/Playwright sourcing runtime for
Mihad.

Current product lane:

`Mandate -> Activation Land Sourcing -> Land Option -> Prefab Estimate -> Spread Underwriting -> Deal Pipeline`

The old generic acquisition search runtime has been narrowed. Browser sourcing
is now only for activation land sourcing around a qualified tenant/investor
mandate.

## Runtime Components

- `services/acquisition-browser-worker`
  - Runs Playwright Chromium in a bounded backend worker.
  - Owns source adapters for public marketplace and broker pages.
  - Captures limited evidence artifacts for each activation land sourcing run.
- `services/zohal-backend`
  - Creates activation mandates and source runs.
  - Invokes the browser worker.
  - Stores sourced land options with attribution.
  - Keeps outreach and promotion behind approval gates.

## Source Run Boundary

`source_runs` is product-valid only for `activation_land_sourcing`.

Do not create source runs for:

- represented Mihad inventory;
- supplier catalog matches;
- normal database lookups;
- anonymous public previews.

Represented inventory and supplier catalog data are direct database fetches.

## Auth Boundary

Public users may draft a mandate, but cannot run sourcing.

Activation land sourcing requires:

- authenticated user/session;
- durable mandate/workspace context;
- sufficient location, activity, size, budget, and timeline fields;
- a passing land-sourcing qualification gate.

## Current Source Targets

The worker may search public/partner sources for:

- commercial plots;
- vacant frontage;
- logistics or light-industrial yards;
- idle land suitable for temporary modular activation;
- broker listings with usable location and rent/size signals.

It must not build a public shadow listing database.

## Candidate Output

Every sourced option should include:

- source name and URL;
- captured timestamp;
- city/district;
- estimated plot size;
- rent/price signal, if available;
- use/zoning hints, if visible;
- access/frontage hints;
- confidence;
- missing fields;
- bounded evidence snapshot.

Raw broker contact details, raw listing text, emails, phones, and authenticated
screenshots must be redacted or excluded unless an operator explicitly approves
the handling path.

## Playwright Auth State

Marketplace auth is opt-in per source through Playwright storage-state files.
The worker must not store marketplace passwords or perform credential login.

An operator may sign in manually once, save a bounded Playwright `storageState`
JSON file, and configure the worker to load it.

Supported auth env vars:

```bash
ACQUISITION_BROWSER_AUTH_STATE_AQAR=/secure/path/aqar.json
ACQUISITION_BROWSER_AUTH_STATE_BAYUT=/secure/path/bayut.json
ACQUISITION_BROWSER_AUTH_STATE_DIR=/secure/path
```

The env names are current compatibility names. Do not introduce new env vars
until the browser worker naming is migrated.

## Guardrails

- Prefer deterministic extraction first.
- Use LLM-assisted extraction only for messy text or screenshots where it adds
  value.
- Treat source-visible claims as claims, not verified truth.
- Store only workflow-relevant evidence.
- Keep public anonymous sessions away from unreviewed sourced leads.
- Keep all outreach approval-gated.

## Product API

Current product-facing trigger:

```http
POST /api/mihad/v1/activation-mandates/:id/land-sourcing
```

Compatibility routes may exist internally, but new web surfaces and docs should
use the activation route.
