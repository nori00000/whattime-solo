# WhatTime Solo Product Spec v1

## Overview

WhatTime Solo is a personal scheduling service for a single host. The product reads the host's Google Calendar availability, exposes a public booking page, shows only bookable time slots, and creates a Google Calendar event when an invitee reserves a slot.

The product is intentionally narrow. It exists to solve one problem reliably:

`Let one person publish a booking link that reflects their actual availability and prevents double-booking.`

## Product Goals

- Replace manual scheduling for one host.
- Generate reliable slots from Google busy data plus host-defined availability rules.
- Prevent double-booking under concurrent booking attempts.
- Keep the host setup simple enough to operate alone.
- Support low-maintenance ongoing operation.

## Non-Goals

- Team scheduling
- Group meetings
- Multiple calendar providers in v1
- Payment collection
- Slack, KakaoTalk, and SMS workflows
- Full automation platform behavior
- Advanced analytics
- Bi-directional sync engine beyond required booking operations

## Primary User

Single owner-operator who:

- already uses Google Calendar
- wants a personal scheduling link
- does not need teammate routing
- values reliability over feature breadth

## RBAC Summary

This is a single-host product, but the system still needs role boundaries so public booking routes, host operations, and future support tooling do not blur together.

Defined roles for v1:

- `platform_admin`
  - reserved for future maintenance and emergency support tooling
  - not exposed in the initial UI
- `host`
  - the authenticated product owner
  - full control over their own calendars, event types, bookings, and settings
- `invitee`
  - unauthenticated public user acting only through a booking page or cancellation token

RBAC design requirements:

- Public booking endpoints must never inherit host authority.
- Invitee actions must be scoped to public booking flow or token-based cancellation only.
- Host actions must be scoped to records they own.
- Future admin surfaces must remain explicitly separated from host features.

For the full matrix and policy guidance, see [RBAC guide](./rbac-guide.md).

## Core User Stories

### Host

- As a host, I can sign in with Google.
- As a host, I can connect one Google account and choose which calendars count as busy.
- As a host, I can define a booking type with duration, buffers, notice, and working hours.
- As a host, I can share a public booking link.
- As a host, I can view upcoming bookings.
- As a host, I can cancel a booking.

### Invitee

- As an invitee, I can open a public link without logging in.
- As an invitee, I can view slots in my local timezone.
- As an invitee, I can submit my name, email, and an optional note.
- As an invitee, I can receive confirmation and cancellation information.

## MVP Scope

### Included

- Google login
- Google Calendar read and event write permissions
- Selection of busy-check calendars
- One-host account model
- Booking type CRUD
- Weekly availability rules
- Date-specific availability overrides
- Public booking page by slug
- Slot generation on request
- Booking confirmation
- Booking cancellation
- Confirmation and cancellation email
- Basic operational logs
- Host-only access boundaries for private surfaces

### Explicitly Deferred

- Outlook, iCloud, Naver, and CalDAV
- recurring override editor beyond a simple date override
- reschedule flow as a first-class feature
- custom form builder
- no-show reminder system
- AI summaries and CRM enrichment
- team member access control UI

## Core Domain Concepts

### Calendar Account

Represents the connected Google account and its OAuth credentials.

### Connected Calendar

Represents an individual Google calendar under the account. The host can mark calendars as included or excluded for busy checks.

### Event Type

Represents a booking template and public link. It defines:

- title
- description
- duration
- buffer before and after
- booking window
- minimum notice
- slot interval
- active or inactive state

### Availability Rule

Represents default recurring weekly working hours by weekday and minute range.

### Availability Date Override

Represents a specific date that either blocks availability entirely or replaces normal working hours for that day.

### Booking

Represents a confirmed reservation created from a chosen slot.

### Booking Lock

Represents a short-lived lock used during booking confirmation to avoid concurrent reservations of the same slot.

## Functional Requirements

### Authentication and Account Setup

- The system must allow sign-in with Google.
- The system must store host account metadata and encrypted provider tokens.
- The system must request the minimum Google scopes needed for:
  - reading calendar availability
  - creating and updating events
- Host-only routes must require a valid authenticated session.

### Calendar Management

- The system must fetch the list of calendars available to the host.
- The host must be able to mark which calendars block availability.
- The system must treat selected calendars as authoritative for busy checks.
- No invitee route may expose provider account metadata beyond what is required for booking.

### Event Type Management

- The host must be able to create, edit, activate, and deactivate event types.
- Each event type must have a unique slug for public access.
- An event type must define:
  - meeting duration in minutes
  - buffer before
  - buffer after
  - minimum notice
  - booking window start and end offsets
  - slot interval
- Host changes must be limited to their own event types.

### Availability Management

- The host must be able to define weekly recurring hours.
- The host must be able to declare a full-day unavailable override.
- The host must be able to declare a replacement time range for a specific date.

### Public Booking Experience

- A public page must show the event type details and available dates.
- Slot times must render in the invitee's local timezone where possible.
- A slot must not be displayed if it violates any booking rules or current busy state.
- Booking submission must validate name, email, slot, and timezone.
- Public routes must never reveal private host settings beyond the intended booking information.

### Booking Confirmation

- The system must acquire a short-lived lock before final confirmation.
- The system must re-run busy validation at confirmation time.
- The system must create a Google Calendar event only after lock acquisition and validation.
- The system must persist the booking only if event creation succeeds.
- The system must release or expire the lock after processing.

### Booking Cancellation

- The system must allow cancellation by host and by invitee token link.
- Cancellation must update local booking status.
- Cancellation should attempt to update or remove the Google Calendar event.
- The canceled slot must become bookable again unless blocked by another rule or event.
- Invitee cancellation authority must be limited to the booking tied to the cancellation token.

### Notification

- The system must send a confirmation email after successful booking.
- The system must send a cancellation confirmation email after successful cancellation.
- Email delivery failure must not corrupt booking state.

## Slot Calculation Rules

The slot engine is the core product behavior. It must follow these rules in order:

1. Determine the booking search window from the event type.
2. Generate candidate dates in the host timezone.
3. Build working intervals for each date from weekly rules.
4. Apply date overrides.
5. Query Google free/busy for selected calendars.
6. Expand busy intervals by configured buffers.
7. Merge overlapping busy intervals.
8. Subtract busy intervals from working intervals.
9. Slice remaining intervals into candidate slots using duration and slot interval.
10. Remove slots violating minimum notice.
11. Remove slots already locked or already booked.
12. Return slots converted for presentation in the invitee timezone.

### Canonical Time Rules

- Persist all timestamps in UTC.
- Interpret weekly availability in the host timezone.
- Interpret date overrides in the host timezone.
- Convert to invitee timezone only for display and form binding.
- Never trust browser-local slot values without server revalidation.

## Booking Integrity Rules

- The public slot list is advisory, not authoritative.
- Final booking confirmation must always re-check availability.
- One slot may only produce one confirmed booking for a given event type and time range.
- A booking lock must expire automatically if confirmation does not complete.
- Event creation failure must not leave a confirmed booking without an external event reference unless a degraded mode is explicitly added later.

## Acceptance Criteria

### Product-Level Acceptance Criteria

- The host can complete first-time setup from sign-in to shareable booking link.
- An invitee can create a booking from the public link without authentication.
- A confirmed booking appears in the host's selected Google Calendar.
- Two concurrent attempts to reserve the same slot result in at most one success.
- Canceling a booking releases the slot for future booking.
- Unauthorized users cannot access host-only APIs or mutate host-owned records.

### Reliability Acceptance Criteria

- Slot calculation returns consistent results for the same inputs.
- Timezone display does not shift booking times incorrectly during confirmation.
- OAuth token refresh is handled without forcing repeated manual reconnect in normal operation.
- External dependency failures produce actionable error states instead of silent corruption.

## Error Model

Standard error codes to reserve now:

- `INVALID_INPUT`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `RATE_LIMITED`
- `CALENDAR_AUTH_EXPIRED`
- `CALENDAR_API_ERROR`
- `SLOT_UNAVAILABLE`
- `BOOKING_LOCK_FAILED`
- `EMAIL_SEND_FAILED`
- `INTERNAL_ERROR`

These codes are for API and operational visibility. The UI may map them to friendlier messages.

## Risks

### Product Risks

- Scope creep into team scheduling before core reliability is proven.
- Over-building the settings UI before the slot engine is stable.

### Technical Risks

- DST and timezone edge cases
- race conditions around booking confirmation
- token expiration and revoked consent
- unexpected Google API quotas or transient failures
- privilege leakage between public and host routes if route guards are inconsistent

### Operational Risks

- silent email failures
- host misconfiguration of blocking calendars
- stale locks if cleanup is not handled correctly

## Operational Design Principles

- Favor clear failure over silent inconsistency.
- Prefer small, observable, recoverable components over clever automation.
- Record enough state to debug user-reported booking issues.
- Keep manual recovery possible for the operator.
- Delay non-essential integrations until core scheduling behavior is stable.
- Treat authorization failures as first-class operational events.

## Release Plan

### Phase 1: Internal MVP

- host authentication
- calendar selection
- event type CRUD
- slot engine
- booking confirmation
- cancellation
- RBAC enforcement for host and invitee surfaces

### Phase 2: Stability

- email notifications
- audit logging
- admin visibility for bookings
- better error states and retry behavior

### Phase 3: Post-MVP Candidates

- reschedule flow
- reminders
- more flexible availability editing
- second calendar provider
- platform admin support console
