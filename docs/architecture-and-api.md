# WhatTime Solo Architecture and API Plan

## Architecture Summary

The application is a monolithic web app built with Next.js. The goal is fast iteration, operational simplicity, and minimal moving parts for a single-owner product.

High-level shape:

- Next.js App Router for UI and HTTP handlers
- PostgreSQL for durable state
- Prisma for persistence
- NextAuth.js (next-auth v4) for host authentication
- Google Calendar API adapter for external calendar interactions
- Email provider adapter for notifications

## Architectural Principles

- Keep external integrations behind service boundaries.
- Put scheduling logic in testable pure functions.
- Make the database the source of truth for local booking state.
- Treat external systems as fallible and observable dependencies.
- Prefer synchronous booking confirmation for MVP so state transitions stay easier to reason about.
- Enforce authorization at route, service, and query boundaries.

## Actual Directory Structure

```txt
src/
  app/
    layout.tsx                 (root Next.js layout)
    page.tsx                   (home page — links to host dashboard and docs)
    [slug]/                    (public booking page)
    api/
      auth/[...nextauth]/
      bookings/               (GET /api/bookings list)
        [id]/cancel/
      calendars/
        [id]/
      event-types/
        [id]/
      public/
        [slug]/               (GET /api/public/:slug — public event type lookup)
          book/
          slots/
        cancel/[token]/
      setup/
        diagnostics/
        readiness/
    bookings/                   (list page)
      [id]/
    cancel/[token]/
    dashboard/
    event-types/               (list page)
      [id]/edit/
      new/
    settings/
      calendars/
      setup/
    sign-in/
  components/
    auth/
    booking/
    bookings/
    event-types/
    settings/
  lib/
    auth/
      options.ts
      public-context.ts
      server-session.ts
      session.ts
    availability/
      engine.ts
      engine.test.ts
      types.ts
    config/
      app-config.ts
      env.ts
      env.test.ts
    db/
      prisma.ts
    domain/
      error-codes.ts
    security/
      encryption.ts
    utils/
      slug.ts
      slug.test.ts
    validation/
      booking.ts
      booking.test.ts
      event-type.ts
      event-type.test.ts
      public-slots.ts
  server/
    authz/
      index.ts
      policies.ts
      roles.ts
    services/
      auth-persistence-service.ts
      availability-service.ts
      booking-service.ts
      booking-service.test.ts
      calendar-service.ts
      event-type-service.ts
      host-booking-service.ts
      setup-service.ts
    test-support/
      booking-fixtures.ts
  types/
    next-auth.d.ts
prisma/
  migrations/
  schema.prisma
prisma.config.ts
docs/
```

Note: Route groups `(app)/` and `(public)/` were not used. All host and public routes are flat under `src/app/`. Tests are co-located alongside source files as `*.test.ts` rather than in a separate `tests/` directory.

## RBAC Architecture

### Roles

- `platform_admin`
- `host`
- `invitee`

### Resource Ownership Model

- `User`, `CalendarAccount`, `ConnectedCalendar`, `EventType`, and host-side `Booking` views are host-owned resources.
- Public booking pages are public-read resources with constrained fields.
- Invitee cancellation uses token-scoped authority, not session-scoped authority.

### Enforcement Layers

Route layer:

- reject unauthenticated host requests
- classify public vs authenticated endpoints clearly

Service layer:

- re-check ownership before mutating records
- centralize role and policy checks in authorization helpers

Query layer:

- always filter host-owned resources by `userId`
- never fetch broad datasets and filter later in memory

### Why RBAC Matters in a Single-Host Product

- public booking routes are still a separate trust domain
- token-based cancellation is a separate authority model
- future admin or support tooling should not require a rewrite of access control assumptions

For the detailed policy matrix, see [RBAC guide](./rbac-guide.md).

## Core Layers

### UI Layer

Responsibilities:

- render host and public pages
- submit validated forms
- present slot and booking state
- map API error codes to user-facing messages

This layer should not contain booking integrity logic or trusted authorization decisions.

### API Layer

Responsibilities:

- parse requests
- authenticate protected routes
- validate input with Zod
- delegate to services
- translate domain errors to stable HTTP responses

This layer should remain thin.

### Service Layer

Responsibilities:

- orchestrate DB access and external APIs
- enforce sequencing of booking confirmation
- apply business rules around activation, locking, and cancellation
- enforce authorization and ownership checks

### Availability Engine

Responsibilities:

- compute bookable slots from rules, overrides, busy intervals, existing bookings, and locks

This must be mostly pure and heavily unit tested.

### Integration Adapters

Responsibilities:

- Google Calendar API calls
- email provider calls
- token refresh

All provider-specific behavior belongs here, not in route handlers.

## Data Flow

### Slot Lookup Flow

1. Public page requests available slots for a slug and date range.
2. API resolves event type and owning user.
3. Availability service loads:
   - event type config
   - weekly rules
   - date overrides
   - selected calendars
   - confirmed bookings in range
   - active booking locks in range
4. Calendar service queries Google free/busy.
5. Availability engine computes candidate slots.
6. API returns display-ready slot payload.

### Booking Flow

1. Public client submits selected slot and invitee data.
2. API validates request and resolves event type.
3. Booking service creates a short-lived booking lock.
4. Booking service re-checks slot availability.
5. Calendar service creates the Google event.
6. Booking service inserts booking row in DB.
7. Email adapter sends confirmation.
8. API returns booking success payload.

### Cancellation Flow

1. Host or invitee submits cancellation.
2. Booking service checks host ownership or cancel token authority.
3. Booking status is transitioned to canceled.
4. Calendar service updates or removes external event.
5. Email adapter sends cancellation notice.

## Data Model Notes

### User

- one product owner account
- stores canonical timezone and profile metadata
- will later carry role metadata if admin tooling is introduced

### CalendarAccount

- stores provider-level tokens
- one host may later have multiple provider accounts, but v1 uses one Google account

### ConnectedCalendar

- materialized list of calendars fetched from provider
- user can opt calendars in and out for busy checks

### EventType

- core user-owned booking template
- all slot rules derive from it

### AvailabilityRule

- recurring default weekly hours
- one event type can have many ranges on one day

### AvailabilityDateOverride

- per-date replacement or blackout

### Booking

- canonical reservation record
- booking lifecycle should be represented by status rather than deletion

### BookingLock

- short-lived reservation guard
- cleanup can be lazy through expiration checks

### Booking Status

Booking lifecycle is represented by status values rather than deletion:

- `CONFIRMED` — slot successfully reserved and external event created
- `CANCELED` — canceled by host or invitee token
- `PENDING` — reserved for internal use if a pre-confirmation state is needed
- `FAILED` — confirmation did not complete successfully

### AuditLog

- append-only record of security-relevant and operational events
- captures actor role, action type, target resource, and optional JSON payload
- used for authorization failure logging, cancellation tracking, and future admin audit trail
- see [RBAC guide](./rbac-guide.md) for the protected resource classification

## API Conventions

- JSON request and response
- explicit `ok` boolean in mutation responses
- stable error code payloads
- protected host routes under authenticated API handlers
- public booking routes strictly rate-limited
- public responses should reveal only fields required by the booking experience

## API Endpoints

### `GET /api/calendars`

Purpose:

- return the host's available calendars and selection states

Auth:

- required role: `host`

### `POST /api/calendars`

Purpose:

- refresh stored calendar list from Google (sync)

Auth:

- required role: `host`

Note: Calendar sync is handled by `POST /api/calendars`, not a separate `/sync` sub-route.

### `PATCH /api/calendars/:id`

Purpose:

- update `selectedForBusyCheck`

Auth:

- required role: `host`

### `GET /api/event-types`

Purpose:

- list host event types

Auth:

- required role: `host`

### `POST /api/event-types`

Purpose:

- create event type and rules

Auth:

- required role: `host`

### `PATCH /api/event-types/:id`

Purpose:

- update event type config and rules

Auth:

- required role: `host`

### `POST /api/event-types/:id/overrides`

Purpose:

- create or replace date-specific override

Auth:

- required role: `host`

Note: Not yet implemented. Date override management is deferred to a later milestone.

### `GET /api/public/:slug`

Purpose:

- return public event type details needed to render the page

Auth:

- public `invitee` context

### `GET /api/public/:slug/slots`

Purpose:

- return available slots for a date range

Auth:

- public `invitee` context

### `POST /api/public/:slug/book`

Purpose:

- attempt to confirm a booking

Auth:

- public `invitee` context

### `GET /api/bookings`

Purpose:

- list host bookings

Auth:

- required role: `host`

### `GET /api/bookings/:id`

Purpose:

- fetch booking detail

Auth:

- required role: `host`

Note: Not yet implemented as a JSON API route. Booking detail is currently served server-side by the `src/app/bookings/[id]/page.tsx` page component. Only the `POST /api/bookings/:id/cancel` sub-route exists.

### `POST /api/bookings/:id/cancel`

Purpose:

- cancel as host

Auth:

- required role: `host`

### `GET /api/public/cancel/:token`

Purpose:

- fetch booking detail for the cancellation confirmation page before cancellation is submitted

Auth:

- token-scoped `invitee` authority

### `POST /api/public/cancel/:token`

Purpose:

- cancel as invitee

Auth:

- token-scoped `invitee` authority

### `GET /api/setup/readiness`

Purpose:

- return environment variable readiness state for the setup page

Auth:

- host session required

### `GET /api/setup/diagnostics`

Purpose:

- return diagnostic information for the setup page

Auth:

- host session required

## Scheduling Engine Specification

### Input Set

- host timezone
- booking window
- minimum notice
- slot interval
- duration
- buffer before and after
- weekly rules
- date overrides
- Google busy intervals
- confirmed bookings
- active booking locks

### Output Set

- ordered list of candidate slots in UTC
- display labels localized to requested timezone

### Edge Cases To Explicitly Cover

- working interval smaller than duration
- busy interval exactly touching slot boundary
- overlapping busy intervals from multiple calendars
- date override replacing weekly rule
- date override marking full-day unavailable
- slot interval smaller than duration
- minimum notice filtering partial same-day availability
- host timezone and invitee timezone on different dates

## Security and Trust Boundaries

- host APIs require authenticated session
- public APIs must never expose provider tokens
- public APIs must enforce rate limits
- slug enumeration should not reveal private metadata beyond the intended event type
- cancellation token must be high-entropy and unguessable
- OAuth credentials must be encrypted at rest
- service methods must not accept trusted `userId` from client payloads

## Observability Plan

### Structured Logs

Log these actions with identifiers:

- sign-in success or failure
- authorization failure
- calendar sync
- event type create, update, or deactivate
- slot query
- booking lock attempt
- booking confirmed
- booking failed
- cancellation requested
- cancellation completed
- external provider failure

### Metrics to Track Later

- booking success rate
- slot query latency
- booking confirmation latency
- Google API failure rate
- email failure rate
- lock conflict count
- authorization failure rate

## Testing Strategy

### Unit Tests

- interval merge
- buffer expansion
- working interval construction
- date override application
- slot slicing
- minimum notice filtering
- authorization policy helpers

### Integration Tests

- event type CRUD
- slot lookup with mocked Google busy data
- booking confirmation with lock conflict
- cancellation flow
- host ownership enforcement on private resources

### E2E Tests

- sign in
- connect calendar
- create event type
- view public slots
- confirm booking
- cancel booking
- verify host-only route protection

## Future Extension Points

- additional calendar providers through provider adapter interface
- reschedule endpoint using same lock and validation path
- reminders through a background job adapter
- lightweight admin console with explicit `platform_admin` access
