# WhatTime Solo Operations Guide v1

## Purpose

This document describes how to run the product effectively as a solo-operated service. The goal is not just building the app, but keeping it healthy with minimal operational burden.

## Operating Philosophy

- Optimize for clear recovery paths.
- Minimize hidden automation in v1.
- Prefer visible errors over silent inconsistencies.
- Keep enough logs and state to investigate support issues quickly.
- Delay advanced infrastructure until real usage proves the need.
- Treat authorization issues as operationally important, not cosmetic.

## Environments

### Local

Used for development and manual validation.

Needs:

- local Postgres or hosted dev database
- Google OAuth credentials for localhost
- email sandbox or disabled email adapter

### Staging

Optional early on, but useful once external integrations are active.

Needs:

- separate DB
- separate Google OAuth app if redirect URIs differ
- email sandbox mode

### Production

Used only after internal flows are validated.

Needs:

- production database
- production OAuth redirect URIs
- production email credentials
- domain and TLS
- dedicated scheduler subdomain, recommended: `meet.sociai.org`

Recommended production topology:

- Sociai main product remains on its existing domain
- the scheduler runs as a dedicated app on `meet.sociai.org`
- Sociai links out to booking pages instead of embedding them inline first

## Required Secrets

Required (no default; app will not start without these):

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_ENCRYPTION_KEY`
- `RESEND_API_KEY`
- `MAIL_FROM`

Optional (with defaults):

- `NEXTAUTH_URL` (optional in `src/lib/config/env.ts`; set explicitly in production to `https://meet.sociai.org`)
- `APP_TIMEZONE` (defaults to `Asia/Seoul`; override for non-KST production deployments)

## Secret Handling Rules

- Never commit secrets to the repository.
- Store secrets in platform-managed environment variables.
- Rotate OAuth and email credentials if accidental exposure is suspected.
- Use separate credentials per environment where practical.

## RBAC Operations Guidance

Roles in operation:

- `host`
- `invitee`
- `platform_admin` reserved for future support tooling

Operational expectations:

- Private operational views must require authenticated host access.
- Public booking flows must remain usable without host privileges.
- Token-based cancellation must be treated as scoped delegated authority.
- Authorization failures should be logged with enough context to identify route misuse or attack patterns.

For policy detail, see [RBAC guide](./rbac-guide.md).

## Critical Operational Paths

### First-Time Host Setup

Checklist:

1. Sign in successfully.
2. Confirm account record created.
3. Sync calendar list.
4. Mark the correct calendars for busy checks.
5. Create one event type.
6. Load public booking page.
7. Verify slot query returns expected times.
8. Create a real booking.
9. Confirm Google event is created.
10. Cancel the booking and confirm cleanup.

This path should become the standard smoke test.

### Normal Booking Path

Expected observable events:

1. public slot query
2. booking lock acquisition
3. Google free/busy validation
4. Google event creation
5. booking row persisted
6. confirmation email attempt

### Normal Cancellation Path

Expected observable events:

1. cancellation request received
2. authorization or token validation completed
3. booking status updated
4. external event update attempt
5. cancellation email attempt

## Failure Modes and Recovery

### Google OAuth Expired or Revoked

Symptoms:

- slot query fails for authenticated host configuration
- booking confirmation cannot create event

Recovery:

- mark account as needing reconnect
- show explicit reconnect prompt to host
- do not silently continue in degraded booking mode unless intentionally designed later

### Google Calendar API Temporary Failure

Symptoms:

- timeout or 5xx during free/busy or event create

Recovery:

- return a retryable error to user
- log failure with provider context
- do not confirm booking unless external event creation succeeded

### Email Provider Failure

Symptoms:

- booking exists but confirmation email not delivered

Recovery:

- keep booking as confirmed
- log `EMAIL_SEND_FAILED`
- expose resend capability later if needed

### Booking Lock Contention

Symptoms:

- concurrent users race for same slot

Recovery:

- allow only one winner
- return `SLOT_UNAVAILABLE` or `BOOKING_LOCK_FAILED` to the loser
- do not retry automatically in a loop

### Authorization Failure or Privilege Leakage Attempt

Symptoms:

- anonymous user hits host routes
- host attempts to mutate another host's resource in future multi-tenant expansion
- invitee token misuse

Recovery:

- log route, actor type, and failure code
- return `UNAUTHORIZED` or `FORBIDDEN`
- never fall back to broader access on partial identity data

### Misconfigured Busy Calendars

Symptoms:

- host appears available when they should be blocked

Recovery:

- expose selected calendars clearly in settings
- log current blocking calendar set on slot query for debugging
- keep a lightweight setup checklist in the UI

## Operational Dashboard Requirements

Even without a full dashboard, the system should allow the host to inspect:

- connected account status
- selected blocking calendars
- active event types
- upcoming bookings
- recent booking failures
- recent external integration failures
- recent authorization failures affecting the host account

## Logging Requirements

Each log should include:

- timestamp
- environment
- actor type
- user id if known
- event type id if relevant
- booking id if relevant
- provider request context when applicable
- error code
- safe summary message

Avoid logging:

- raw OAuth tokens
- invitee secrets
- unnecessary PII in free-form notes

## Data Retention Guidance

Initial policy:

- keep booking rows indefinitely until a real retention policy is needed
- keep audit logs for at least 90 days
- periodically purge expired booking locks

## Recommended Default Scheduling Policy

For solo-host operation, use these defaults unless a specific event type needs something else:

- duration: 30 minutes
- buffer before: 10 minutes
- buffer after: 15 minutes
- minimum notice: 120 minutes
- booking window: 14 days
- slot interval: 30 minutes

This balances calendar density with enough space to avoid stacked bookings and rushed transitions.

Note: `src/lib/config/app-config.ts` currently has `defaultMinimumNoticeMinutes=60` and `defaultBookingWindowEndDays=30`, which differ from the operational recommendation above. The Zod schema in `src/lib/validation/event-type.ts` and the Prisma schema (`prisma/schema.prisma`) also default to the same mismatched values (60 min / 30 days). The event type creation form in `src/components/event-types/event-type-form.tsx` defaults `minimumNoticeMinutes` to `120` (user-editable form field) and hardcodes `bookingWindowEndDays: 14` directly in the submission payload (not exposed in the form UI), both bypassing the config and schema defaults. Reconcile `app-config.ts`, `src/lib/validation/event-type.ts`, `prisma/schema.prisma`, and the form defaults before production to avoid confusion.

## Manual Runbooks

### Runbook: Booking Did Not Show on Calendar

1. Look up booking by ID or invitee email.
2. Confirm booking status.
3. Check `externalEventId`.
4. Review booking creation logs.
5. If booking is missing external event, inspect Google API failure log.
6. Decide whether to recreate event manually or cancel the booking.

### Runbook: Invitee Says Slot Was Booked Twice

1. Query bookings for the event type and time range.
2. Review lock records and timestamps.
3. Review provider event IDs.
4. Confirm whether the duplicate was local, external, or perception caused by timezone mismatch.
5. If a real duplicate exists, prioritize fixing lock or validation logic before new feature work.

### Runbook: Host Availability Looks Wrong

1. Review selected busy calendars.
2. Review weekly rules and date overrides.
3. Re-run slot query for the same range.
4. Inspect Google free/busy response summary.
5. Check timezone assumptions for the host account.

### Runbook: Repeated Authorization Failures

1. Review recent failure logs by route and actor type.
2. Determine whether failures are normal session expiry, token misuse, or malicious probing.
3. Confirm route guards and service-level ownership checks on the affected path.
4. If public abuse is suspected, tighten rate limits and review exposed response details.

## Release Readiness Checklist

Before first real use:

- booking flow tested end-to-end
- cancellation flow tested end-to-end
- timezone edge case tested with at least one non-KST timezone
- double-booking race tested
- reconnect flow tested by invalidating Google token
- host-only route protection tested
- token-based cancellation scope tested
- log visibility confirmed
- basic rate limiting enabled on public routes

## On-Call Reality for a Solo Operator

This product should be designed so the operator can diagnose most issues in under 10 minutes. To support that:

- every booking should have a traceable status
- external event IDs must be persisted
- all failures should map to explicit error codes
- setup state must be visible without querying the database manually
- authorization failures must be visible without digging through raw provider logs

## Cost Control

- start with serverless or managed hosting
- avoid always-on workers in v1
- avoid unnecessary background jobs
- constrain slot query range to reduce provider API usage
- add caching only after measuring repetitive read patterns

## Operational Backlog After MVP

- add health check endpoint
- add admin page for recent failures
- add retry path for failed emails
- add reconnect banner for expired calendar auth
- add low-noise alerting for repeated provider failures
- add admin-only incident notes if `platform_admin` tooling is introduced
