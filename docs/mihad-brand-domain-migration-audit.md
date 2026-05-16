Status: Working
Last reviewed: 2026-05-16

# Mihad Brand And Domain Migration Audit

This tracks the external and high-caution work needed to complete the Zohal to
Mihad rename. It should graduate to an implementation runbook once the target
production domains and dashboard changes are approved.

## Safe In-Repo Changes Started

- Web metadata and localized visible app strings now use Mihad where practical.
- Theme tokens now follow `Documentation/Design/Mihad Design.md`.
- Internal compatibility names such as `zohal_templates`, `zohal-light`,
  `zohal-dark`, `zohal_checkout_state`, and `invokeZohalBackendJson` are not
  renamed in this pass because they are API, storage, or migration surfaces.

## Domain Decisions Needed

- Canonical domains:
  - marketing/app: `mihad.properties` / `www.mihad.properties`
  - Living Interface delivery: `live.mihad.properties`
  - backend/API: `experiences-publication-api.mihad.properties` and any
    `zohal-backend` Cloud Run ingress URL
  - support/mail: `support@mihad.properties`
- Decide redirect policy from current Zohal domains to new Mihad domains.
- Decide how long old domains remain valid for auth callbacks, published links,
  emails, QR codes, and customer bookmarks.

## Third-Party / Dashboard Updates Required

- DNS and hosting:
  - add `mihad.properties` and `www.mihad.properties` to the current hosting
    provider and future Firebase Next.js Hosting plan
  - configure TLS, canonical redirects, sitemap host, robots host, and preview
    domain policy
- Vercel:
  - current project metadata still references `zohal-web`
  - project domains and env values need dashboard updates if Vercel remains in
    the transition path
- Supabase:
  - Auth Site URL
  - Additional Redirect URLs for `/auth/callback` and password reset flows
  - email template copy and sender display name
  - any allowed origin / CORS settings used by Edge compatibility surfaces
- Google Cloud / Cloud Run:
  - Cloud Run service names such as `zohal-backend`
  - env vars `NEXT_PUBLIC_ZOHAL_BACKEND_URL` / `ZOHAL_BACKEND_URL`
  - deployment scripts and IAM/OIDC project labels
  - GCS bucket names and docs that reference `zohal-saudi`
- Cloudflare delivery:
  - `live.mihad.properties` fallback host in published Living Interface links
  - publication API base URLs using `mihad.properties`
  - DNS, Workers/routes, and any access/redeem link allowlists
- Google OAuth / Google APIs:
  - authorized JavaScript origins for the new domain
  - authorized redirect URIs for Supabase and popup flows
  - Google Maps API HTTP referrer restrictions
  - OAuth consent screen app name and domain verification
- Microsoft Entra / OneDrive:
  - SPA redirect URI for popup/auth flows
  - publisher/application display name
  - allowed origins if configured
- Payments:
  - Moyasar dashboard business name, checkout display text, callback/webhook
    URLs, and allowed domains
  - Stripe remains part of the broader payment architecture; verify customer
    portal, webhook endpoint, branding, and statement descriptors before any
    Stripe-backed flow is re-enabled or expanded
- Email:
  - Resend sender domains and `SUPPORT_EMAIL_FROM` / `INVITES_FROM_EMAIL`
  - support destination aliases and public legal contact links
- WhatsApp / messaging:
  - template copy that says Zohal or زحل
  - sender/business profile name
  - webhook URLs and verified business display names
- Apple/iOS:
  - iOS is parked, but a full public rename later needs App Store Connect app
    name, bundle/display name, associated domains, universal links, StoreKit
    products, Firebase plist entries, and support URLs reviewed before iOS is
    resumed.

## Compatibility Names To Keep Until Planned

- `zohal_templates` and `zohal_library` are persistence/API compatibility
  concepts. Public labels can say Mihad, but stored values need a migration plan.
- `zohal-light` and `zohal-dark` are DOM/theme compatibility values.
- `zohal:*` browser events, localStorage keys, and test fixtures can remain until
  a deliberate compatibility cleanup is scheduled.
- `services/zohal-backend` and package names can remain as deployment/source
  compatibility names until Cloud Run, CI, and documentation are moved together.

## Verification Checklist For The Real Domain Cutover

- New domain loads the web app and all protected redirects work.
- Magic-link sign in, password reset, Google Sign-In, Google Drive import,
  Microsoft OneDrive import, Google Calendar export, Moyasar checkout/trial, and
  WhatsApp intake all complete on the Mihad domain.
- Sitemap, robots, OpenGraph, legal pages, email links, and support forms use
  the Mihad canonical URLs.
- Existing Zohal links redirect or continue working according to the approved
  compatibility window.
