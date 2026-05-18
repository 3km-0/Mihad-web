# Mihad Private Luxury Digest Transition Report

Status: Active transition report  
Last updated: 2026-05-18

## Current MVP State

The public web MVP now follows the latest business plan:

`Private Digest -> Editorial Property Page -> Confidential Interest -> Manual Screening -> Owner-Controlled Broker Step`

The public surface no longer presents Mihad as a prefab, land activation, supplier, calculator, or open marketplace product. The active public experience is:

- `/home` — premium private-digest landing page.
- `/properties` — curated digest surface. No real properties are public yet.
- `/properties/editorial-format-preview` — clearly marked presentation preview, not an available property.
- `/submit-property` — owner or authorized representative intake.
- `/private-interest` — serious buyer inquiry intake.
- `/about` — discretion, screening, and brokerage posture.
- `/privacy` and `/terms` — MVP-level privacy and non-binding inquiry language.

Retired public routes redirect away from old surfaces:

- `/market` -> `/properties`
- `/request-quote` -> `/private-interest`
- `/calculator` -> `/home`
- `/models` -> `/properties`
- `/suppliers` -> `/about`
- `/fieldbook` -> `/properties`
- `/guides` -> `/about`
- `/for-businesses` -> `/private-interest`
- `/for-manufacturers` -> `/submit-property`
- `/showcase` -> `/properties`

## What Was Built In This Pass

- A new static private digest data layer at `src/lib/private-digest.ts`.
- Visibility filtering so `private_link` properties do not appear in the public digest or sitemap.
- Two lightweight, schema-free APIs:
  - `POST /api/private-digest/owner-submission`
  - `POST /api/private-digest/private-interest`
- Client forms for owner submissions and buyer private interest.
- A private-digest shell with premium nav, footer, and mobile bottom nav.
- New public pages for the private digest MVP.
- Public metadata and sitemap updated to the private luxury-home direction.
- Tests for property visibility filtering and form validation.

No database migration was added. No file uploads were added. No proof-of-funds documents are accepted. No public prices, exact addresses, owner identities, or owner contact details are shown.

## Immediate Completion Work

These items should be done before treating the MVP as launch-ready.

### 1. Legal And Brokerage Review

- Confirm the exact brokerage license posture, allowed language, commission disclosure requirements, mandate requirements, and advertising restrictions with qualified Saudi real estate/legal professionals.
- Replace placeholder “brokerage posture” language with approved copy.
- Decide whether Mihad can say “licensed broker” publicly and whether a license number must be displayed.
- Prepare approved owner consent, buyer consent, confidentiality, and brokerage disclosure text.
- Define what happens before viewings, deeper address disclosure, owner identity disclosure, and proof-of-funds requests.

### 2. First Real Property Workflow

- Create the first owner pitch and consent checklist from the business plan.
- Secure one real exceptional property before adding public gallery content.
- Collect owner-approved media and copy.
- Confirm property quality, authority to represent, privacy level, and exact details that must stay hidden.
- Replace or supplement the current format preview only after owner approval.
- Keep any unapproved property private-link only and excluded from sitemap.

### 3. Manual CRM And Notification Path

- Decide the manual CRM source for v1: spreadsheet, Notion, Airtable, or existing internal workspace.
- Wire API submissions to an internal notification path only after reviewing secrets and destinations.
- Keep submitted owner/buyer data out of logs except sanitized reference IDs.
- Add an operator-only review checklist for:
  - owner authority
  - media authenticity
  - privacy settings
  - buyer identity
  - funding/proof readiness
  - timeline and seriousness

### 4. Real Media Standard

- Define the original-media policy in operational detail:
  - accepted file types
  - owner upload channel
  - metadata review consent
  - storage location
  - who can access raw media
  - retention period
- Do not add file upload to the public site until storage, access control, metadata handling, and legal language are approved.
- For now, collect readiness and continue manually through WhatsApp or private follow-up.

### 5. Production Copy Polish

- Replace any remaining generic “property” copy with more premium Saudi-facing language where appropriate.
- Keep Arabic first.
- Avoid:
  - marketplace
  - listings
  - inventory
  - buy now
  - make offer
  - contact seller
  - valuation
  - public price
- Prefer:
  - private digest
  - curated
  - serious interest
  - confidential inquiry
  - screened before owner is approached
  - owner-controlled showcase

## Code Cleanup To Finish The Transition

The current implementation safely redirects old public routes, but old modules still exist because other internal/operator areas may reference them. The next cleanup should remove them only after dependency checks.

### Public Route Cleanup Candidates

These files are now redirect shims and can eventually be removed if external links are not needed:

- `src/app/(public)/calculator/page.tsx`
- `src/app/(public)/fieldbook/page.tsx`
- `src/app/(public)/fieldbook/[slug]/page.tsx`
- `src/app/(public)/categories/[slug]/page.tsx`
- `src/app/(public)/guides/page.tsx`
- `src/app/(public)/guides/[country]/page.tsx`
- `src/app/(public)/market/page.tsx`
- `src/app/(public)/models/page.tsx`
- `src/app/(public)/models/[slug]/page.tsx`
- `src/app/(public)/suppliers/page.tsx`
- `src/app/(public)/suppliers/[slug]/page.tsx`
- `src/app/(public)/for-businesses/page.tsx`
- `src/app/(public)/for-manufacturers/page.tsx`
- `src/app/(public)/showcase/page.tsx`
- `src/app/(public)/request-quote/page.tsx`

Keep the redirects during the early transition if users or search engines may still hit old URLs.

### Old Public Prefab/Activation Modules

These are no longer used by the private-digest public MVP, but may still be referenced by internal pages or tests:

- `src/components/prefab/*`
- `src/lib/prefab-*`
- `src/lib/activation-*`
- `src/app/api/request-quote/route.ts`
- old acquisition/RFQ/operator pages under `src/app/(app)/`

Recommended sequence:

1. Run `rg "components/prefab|prefab-|activation-|request-quote|rfq" src`.
2. Classify references as public, internal app, backend compatibility, or tests.
3. Delete public-only pieces first.
4. Keep internal compatibility pieces until the old app/operator surfaces are either migrated or explicitly retired.
5. Remove stale tests only after the code they cover is removed.

### Documentation Cleanup Candidates

Deleted in this pass:

- `docs/activation-land-sourcing-runtime.md`

Still present but likely needs review:

- `docs/investment-scoring.md` — belongs to the previous acquisition/investment workflow and may not fit the private digest MVP. Delete or archive after confirming whether internal workspace scoring still needs it.
- `docs/mihad-brand-domain-migration-audit.md` — still useful for domain/brand migration and should remain until domain work is complete.

## Product Work Still Needed

### Property CMS

The MVP uses static data. Before adding more than one or two real homes, decide whether to use:

- a simple local data file with manual deploys;
- a private CMS;
- an existing database table;
- a separate admin-only property review workflow.

Minimum future property model:

- slug
- title
- city/area
- property type
- visibility
- status
- hero image
- gallery images
- story
- design highlights
- limited feature summary
- privacy notes
- owner approval status
- exact-location visibility flag
- public-price visibility flag, default false

### Inquiry Storage

Current APIs return references and WhatsApp links only. A real operating flow needs durable storage or CRM handoff for:

- owner submissions
- buyer private interest
- screening status
- follow-up notes
- owner approval state
- confidentiality state
- next action owner

Do not store proof-of-funds files or sensitive documents until access control and retention rules are approved.

### Private Links

The static data supports `private_link` visibility, but private links are currently simple URLs. Before using them for sensitive real homes:

- add unguessable tokens or password gates;
- exclude private pages from sitemap;
- add noindex metadata;
- restrict deeper details until manual approval;
- add event tracking for page views and interest clicks.

### Analytics

Track only high-signal events:

- owner path clicked
- buyer path clicked
- property preview viewed
- private interest started
- private interest submitted
- owner submission submitted

Avoid analytics payloads that include owner identity, buyer identity, phone numbers, private notes, exact locations, proof details, or sensitive property descriptions.

## Explicitly Out Of Scope Until Approved

- Public prices
- exact addresses
- owner identity disclosure
- direct owner-buyer chat
- instant viewing booking
- public bidding
- automated offers
- formal valuation tools
- proof-of-funds upload
- owner dashboards
- buyer accounts
- payment collection
- database migrations
- production deploy or hosting changes

## Acceptance Criteria For The Transition

The transition can be considered complete when:

- `/home`, `/properties`, `/submit-property`, `/private-interest`, `/about`, `/privacy`, and `/terms` are the only active public product surfaces.
- Old public routes either redirect or are removed.
- No public page uses prefab, activation, supplier, calculator, open marketplace, listing, public price, valuation, or instant owner-contact positioning.
- The first real property is owner-approved and has a documented privacy setting.
- Owner and buyer submissions land in a reviewed manual CRM.
- Legal copy and brokerage disclosures have been reviewed by qualified professionals.
- The old acquisition/prefab/activation docs and code paths have either been deleted or explicitly marked as internal compatibility.
