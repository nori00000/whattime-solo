# Deployment and Sociai Integration Guide

## Recommended Topology

Run the scheduler as a separate web app and link to it from Sociai.

- public scheduler domain: `https://meet.sociai.org`
- Sociai page CTA target: `https://meet.sociai.org/<event-type-slug>`
- preferred integration pattern: open a dedicated booking page in a new tab or same tab

This is intentionally not an iframe-first design. A dedicated page is more stable for:

- Google OAuth redirects
- mobile browser behavior
- cookie/session handling
- visual consistency across host and public booking flows

## Hosting Recommendation

Use this stack first:

- frontend and server routes: `Vercel`
- database: `Neon Postgres`
- domain: `meet.sociai.org`
- email later: `Resend`

Reasoning:

- the app is already a Next.js server-rendered product
- Vercel handles the App Router well with minimal ops overhead
- Neon fits low-volume personal scheduling well

## Production Environment Variables

Required:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_ENCRYPTION_KEY`
- `RESEND_API_KEY`
- `MAIL_FROM`

Optional (with defaults):

- `NEXTAUTH_URL=https://meet.sociai.org` (optional in `src/lib/config/env.ts`; recommended to set explicitly in production)
- `APP_TIMEZONE=Asia/Seoul` (optional; defaults to `Asia/Seoul` if unset)

Note: `RESEND_API_KEY` and `MAIL_FROM` are validated as required by `src/lib/config/env.ts`. Even though email delivery is not yet fully implemented, these variables must be present for the app to start. Set them to real values before deploying.

## Google OAuth Production Settings

Production redirect URI:

`https://meet.sociai.org/api/auth/callback/google`

Keep local redirect URI too:

- `http://localhost:3002/api/auth/callback/google`
- `https://meet.sociai.org/api/auth/callback/google`

## Deployment Checklist

1. Push the repository to GitHub.
2. Create a new Vercel project from the repository.
3. Create a Neon Postgres database.
4. Add all required environment variables in Vercel.
5. Set up the custom domain `meet.sociai.org`.
6. Add the production Google OAuth redirect URI.
7. Run Prisma migrations against production.
8. Sign in as the host and sync calendars.
9. Create a production event type.
10. Add the Sociai CTA button that links to the public booking page.

## Sociai Integration Pattern

Preferred CTA copy:

- `약속 잡기`
- `미팅 예약`
- `상담 일정 잡기`

Recommended HTML pattern:

```html
<a href="https://meet.sociai.org/30-minute-intro-call-4d34c0">
  약속 잡기
</a>
```

Recommended behavior:

- place the CTA in author/profile/contact surfaces
- avoid embedding the booking UI inline until the standalone flow has proven stable
- if Sociai supports analytics, track outbound CTA clicks separately from booking conversions

## Booking Integrity Policy

The service should only offer slots that are truly free on the host calendar.

Operational rules:

- enable `busy-check` only for calendars that must block real availability
- keep reference calendars unchecked if they should not block booking
- use Google Calendar `Show me as: Available` for events that should not block time
- treat `freeBusy` as the source of truth for blocking intervals

## Default Production Booking Policy

Recommended defaults for Sociai:

- duration: `30` minutes
- buffer before: `10` minutes
- buffer after: `15` minutes
- minimum notice: `120` minutes
- booking window: `14` days
- slot interval: `30` minutes

This combination prevents near back-to-back meetings while keeping enough availability visible.

## Post-Deploy Smoke Test

1. Sign in on `meet.sociai.org`.
2. Confirm host dashboard access.
3. Sync calendars.
4. Verify the correct calendars are selected for busy checks.
5. Open an event type public page.
6. Confirm free slots appear.
7. Create a real booking.
8. Confirm the event appears in Google Calendar.
9. Cancel the booking as host.
10. Confirm the slot reopens and the Google event is removed or cancelled.
