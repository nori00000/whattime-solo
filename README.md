# WhatTime Solo

Personal scheduling service for a single host. The product reads Google Calendar availability, exposes a public booking page, and creates a Google Calendar event when an invitee reserves a slot.

## Current State

The MVP is working locally end to end:

- Google sign-in
- host dashboard
- calendar sync and busy-check selection
- event type create, list, and edit
- public slot lookup
- booking creation
- host and invitee cancellation flow

Read these documents before building:

- [Product spec](./docs/product-spec.md)
- [Architecture and API plan](./docs/architecture-and-api.md)
- [RBAC guide](./docs/rbac-guide.md)
- [Operations guide](./docs/operations.md)
- [Deployment and Sociai integration guide](./docs/deployment-and-sociai.md)
- [Current plan](./docs/current-plan.md)
- [Current status](./docs/current-status.md)

## Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

## Working Order

1. Lock planning documents.
2. Add data model and environment contracts.
3. Implement auth and Google integration.
4. Build the availability engine with tests.
5. Build booking and cancellation flows.
6. Add operational visibility and hardening.
7. Deploy on `meet.sociai.org` and link from Sociai.
