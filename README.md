# WhatTime Solo

Personal scheduling service for a single host. The product reads Google Calendar availability, exposes a public booking page, and creates a Google Calendar event when an invitee reserves a slot.

> **한눈에 / At a glance**
>
> Google Calendar availability, public booking links, and cancellation flows for a
> solo operator.
>
> 한영 프로젝트 설명, 검색 키워드, 저작권 범위는 [PROJECT.md](./PROJECT.md)와
> [NOTICE.md](./NOTICE.md)를 먼저 확인하세요.

This is an independent project. Third-party product names and service names in
this repository are used only to describe integrations; see [NOTICE.md](./NOTICE.md)
for trademark and asset notes.

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
