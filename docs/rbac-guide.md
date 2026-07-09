# WhatTime Solo RBAC Guide v1

## Purpose

This document defines the authorization model for WhatTime Solo. Even though the first version targets a single host, the system already has multiple trust domains:

- authenticated host operations
- unauthenticated public booking traffic
- token-scoped invitee cancellation
- future platform administration

RBAC exists to keep those domains explicit.

## Design Principles

- Keep public and private surfaces clearly separate.
- Authorize by both role and resource ownership.
- Token-based authority must be scoped and limited.
- Authorization checks belong in more than one layer.
- Deny by default.

## Roles

### `platform_admin`

Purpose:

- reserved for future maintenance and support operations

Can:

- inspect system-level incidents
- inspect user account state if an admin console is added later
- perform emergency maintenance actions if explicitly implemented

Cannot by default:

- impersonate hosts silently
- bypass audit logging
- mutate bookings or calendars without explicit admin-only actions

Status in v1:

- defined in policy
- not exposed in initial product UI

### `host`

Purpose:

- authenticated owner of the scheduling account

Can:

- manage their own connected calendars
- manage their own event types and availability rules
- view and cancel their own bookings
- view their own settings and operational state

Cannot:

- access another host's resources
- use admin-only functions if introduced later

### `invitee`

Purpose:

- public visitor interacting with a booking page

Can:

- read public event type presentation data
- request available slots
- create a booking
- cancel a booking with a valid cancellation token

Cannot:

- access host dashboard routes
- inspect host settings
- list bookings broadly
- mutate resources outside the booking or token scope

## Resources

Protected resource categories:

- `user`
- `calendar_account`
- `connected_calendar`
- `event_type`
- `availability_rule`
- `availability_date_override`
- `booking`
- `audit_log`

Public or semi-public categories:

- `public_event_type_view`
- `public_slot_query`
- `booking_cancellation_token`

## Authorization Model

### Rule 1: Role Alone Is Not Enough

Host-facing resources require both:

- authenticated role `host`
- ownership match on `userId`

### Rule 2: Public Access Is Narrow

Invitee access is not broad read access. It is limited to:

- event type display fields intended for booking
- available slot retrieval
- booking creation
- token-scoped cancellation

### Rule 3: Token Access Is Delegated Access

Cancellation token authority is:

- single-purpose
- booking-specific
- revocable by status change
- never equivalent to a host session

### Rule 4: Admin Access Must Stay Explicit

If `platform_admin` surfaces are introduced later, they must:

- be routed separately
- be audited separately
- avoid hidden privilege inheritance from host flows

## Permission Matrix

| Action | platform_admin | host | invitee |
| --- | --- | --- | --- |
| Sign in to host dashboard | Optional future | Yes | No |
| View own dashboard | No by default | Yes | No |
| View public booking page | Yes if needed | Yes | Yes |
| View own calendars | Optional future | Yes | No |
| Update busy-check calendar selection | Optional future | Yes | No |
| Create event type | Optional future | Yes | No |
| Update own event type | Optional future | Yes | No |
| Deactivate own event type | Optional future | Yes | No |
| Query public slots | Yes if needed | Yes | Yes |
| Create booking | No by default | Optional if using own public flow | Yes |
| View own bookings | Optional future | Yes | No |
| Cancel own booking as host | Optional future | Yes | No |
| Cancel via valid token | No by default | Not needed | Yes |
| View audit logs | Optional future | Limited own scope if added | No |

## Route Classification

### Host Routes

Examples:

- `/dashboard`
- `/event-types`
- `/bookings`
- `/settings`
- `/settings/calendars`
- `/settings/setup`
- `/api/calendars/*`
- `/api/event-types/*`
- `/api/bookings/*`
- `/api/setup/*`

Policy:

- require authenticated host session
- scope all data access by owner

### Public Routes

Examples:

- `/:slug`
- `/api/public/:slug`
- `/api/public/:slug/slots`
- `/api/public/:slug/book`
- `/cancel/:token`
- `/api/public/cancel/:token`

Policy:

- no host session required
- restrict output shape
- enforce rate limiting
- never infer host authority from public input

### Future Admin Routes

Examples:

- `/admin/*`
- `/api/admin/*`

Policy:

- separate guard
- separate logging
- explicit feature flag or deployment gate

## Enforcement Strategy

### Route Layer

- require session presence for host routes
- classify actor as `host`, `invitee`, or anonymous-public request
- short-circuit unauthorized access early

### Service Layer

- require caller context object
- verify ownership before mutation or private read
- avoid ad hoc permission checks scattered through route handlers

### Query Layer

- include `userId` in where clauses for host-owned resources
- do not fetch first and filter later

### Audit Layer

- log denied access attempts
- log token-based cancellations
- log admin actions distinctly if admin role is activated later

## Caller Context Model

Recommended internal shape:

```ts
type ActorRole = "platform_admin" | "host" | "invitee";

type CallerContext =
  | { role: "host"; userId: string }
  | { role: "platform_admin"; userId: string }
  | { role: "invitee"; bookingToken?: string };
```

All service entry points should accept or derive a caller context rather than trusting raw request data.

## Ownership Rules

- `calendar_account.userId` must match host `userId`
- `connected_calendar.userId` must match host `userId`
- `event_type.userId` must match host `userId`
- `booking.userId` must match host `userId` for host-side reads and writes
- invitee token can only operate on the booking carrying that token

## Error Handling Rules

- return `UNAUTHORIZED` when authentication is missing
- return `FORBIDDEN` when identity exists but access is not allowed
- avoid detailed leakage of resource existence on protected routes where possible
- log enough internal detail to distinguish expired session from policy denial

## Testing Requirements

### Unit

- role policy helper tests
- ownership guard tests
- token-scoped permission tests

### Integration

- host cannot access another host's resource
- invitee cannot access host APIs
- invalid cancellation token cannot mutate booking state

### E2E

- anonymous user redirected or denied for host dashboard
- public booking page remains accessible
- valid token cancels only its own booking

## Operational Guidance

- monitor repeated authorization failures on public APIs
- monitor attempts against host routes without session
- include actor role in structured logs
- keep authorization error messages safe for public consumption

## Migration Guidance for Future Multi-User Expansion

If the product expands later:

- keep `host` semantics tenant-scoped
- add organization or workspace ownership explicitly
- do not overload `platform_admin` into a business-user role
- preserve token-scoped invitee authority as a separate access path
