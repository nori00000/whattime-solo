# Current Plan

## Objective

Build a solo-use scheduling service that reads Google Calendar availability and allows invitees to book reliable 1:1 time slots from a public link.

## Scope Lock

In scope:

- single host
- Google login
- Google Calendar busy-read and event-write
- event type CRUD
- weekly availability
- date overrides
- public slot query
- booking confirmation
- cancellation
- email confirmation
- RBAC enforcement for host and invitee boundaries

Out of scope:

- teams
- group scheduling
- payments
- non-Google providers
- advanced automations

## Work Sequence

1. Finalize planning documents and operating model.
2. Add Prisma schema and project structure.
3. Implement auth and Google account connection.
4. Implement calendar sync and selection.
5. Implement event type CRUD.
6. Implement availability engine with tests.
7. Implement public slot and booking flows.
8. Implement cancellation and email notifications.
9. Add operational visibility and hardening.
10. Add authorization guard tests across host and public boundaries.

## Quality Gates

- availability engine covered by unit tests before UI polish
- booking confirmation path revalidates slot before event creation
- all mutating APIs return explicit error codes
- no provider tokens exposed outside secure server boundaries
- role and ownership checks centralized rather than duplicated ad hoc

## Current Focus

The planning artifacts are complete. Current implementation focus is:

1. Prisma-backed user and account persistence
2. Google calendar sync and busy-check selection
3. host-side route protection and ownership enforcement
