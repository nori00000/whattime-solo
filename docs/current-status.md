# Current Status

## Summary

The local MVP works end to end. Planning documents remain the source of truth for scope, authorization model, deployment posture, and operational constraints.

## What Exists

- planning documents for product, architecture, operations, and RBAC
- deployment and Sociai integration guide
- Prisma schema for the core scheduling domain
- RBAC role and policy scaffolding in `src/server/authz`
- environment contract baseline in `.env.example` and `src/lib/config/env.ts`
- installed core packages for Prisma, Auth.js, Zod, date handling, and Vitest
- Prisma client singleton and auth/session scaffolding
- Prisma 7 config moved to `prisma.config.ts`
- NextAuth.js route and Google provider configuration scaffolded
- host-only dashboard stub and server-session guard added
- sign-in now persists host and encrypted Google account credentials in Prisma
- protected calendar APIs added for list, sync, and busy-check selection
- Prisma client creation is now lazy and uses the Prisma 7 PostgreSQL adapter
- event type validation, service layer, and protected CRUD APIs added
- availability engine pure functions and unit tests added
- public event type lookup, slot query API, and slug page scaffold added
- booking confirmation API, lock flow, Google event creation, and cancel-token scaffolding added
- host-side event type creation page and form added
- event type list/edit pages added
- booking service dependency-injection refactor and tests added
- setup readiness page/API added
- host cancel now attempts Google Calendar event deletion too
- project-local PostgreSQL server initialized on port `5433`
- local `.env` and `.env.local` prepared with working database configuration
- initial Prisma migration applied to the local database
- live Google sign-in verified on `localhost:3002`
- host-side calendar selection UI added
- host-side booking list/detail/cancel UI added
- public booking flow exercised successfully
- event type defaults now align with solo-host operations:
  - 30-minute duration
  - 10-minute buffer before
  - 15-minute buffer after
  - 120-minute minimum notice
  - 14-day booking window

> **Known config discrepancy (reconcile before production):**
> `src/components/event-types/event-type-form.tsx` defaults `minimumNoticeMinutes` to `120`
> (user-editable form field) and hardcodes `bookingWindowEndDays: 14` directly in the submission
> payload (not exposed in the form UI). Both match the operational recommendation. However,
> `src/lib/config/app-config.ts` (`defaultMinimumNoticeMinutes=60`, `defaultBookingWindowEndDays=30`),
> the Zod schema in `src/lib/validation/event-type.ts` (`.default(60)`, `.default(30)`), and
> `prisma/schema.prisma` (`@default(60)`, `@default(30)`) all use different values.
> Direct API calls that omit these fields will receive the schema defaults (60 min / 30 days),
> not the form defaults (120 min / 14 days). See also: `docs/operations.md`
> "Recommended Default Scheduling Policy" note.

## What Has Not Started

- confirmation email and cancellation email delivery
- richer host-side availability editor
- production deployment on `meet.sociai.org`
- Sociai outbound CTA placement
- broader integration tests for route handlers

## Verification

- `npm run lint` passes
- `npm test` passes
- `npm run db:generate` passes
- `npm run db:migrate:dev -- --name init` applied successfully against the local PostgreSQL database
- `npm run build` passes
- live Google provider sign-in verified locally
- public event type page renders real available slots
- event type creation verified in the browser

## Risks

- production deployment is not wired yet
- email delivery is still missing
- the host-side availability editor is still intentionally narrow
- the current local database is not a production persistence layer

## Next Action

Deploy the app to `meet.sociai.org`, add the production Google OAuth callback, migrate the production database, and then place a Sociai CTA that links to the public booking page.
