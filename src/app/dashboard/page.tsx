import Link from "next/link";

import { requireHostPageSession } from "@/lib/auth/server-session";
import { listConnectedCalendars } from "@/server/services/calendar-service";
import { listEventTypes } from "@/server/services/event-type-service";

const foundationChecklist = [
  "Google OAuth credentials wired and verified",
  "Prisma migrations created and database connected",
  "Host user record synced into Prisma on sign-in",
  "Calendar sync and busy-check selection implemented",
  "Event type CRUD and availability engine connected",
];

export default async function DashboardPage() {
  const host = await requireHostPageSession();
  const calendars = await listConnectedCalendars(host.userId);
  const eventTypes = await listEventTypes(host.userId);

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Host Dashboard
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
            Protected host surface is now wired.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-stone-600">
            This page exists to enforce the host-only trust boundary early. It
            will become the base for calendars, event types, bookings, and
            operational state once those modules are implemented.
          </p>
          <div className="mt-8 grid gap-4 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6 text-sm leading-7 text-stone-700 sm:grid-cols-2">
            <div>
              <p className="font-semibold text-stone-950">Authenticated host</p>
              <p>{host.userId}</p>
            </div>
            <div>
              <p className="font-semibold text-stone-950">Role</p>
              <p>{host.role}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <article className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
            <p className="text-sm font-semibold text-stone-950">
              Foundation checklist
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600">
              {foundationChecklist.map((item) => (
                <li key={item} className="rounded-xl bg-white px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
            <p className="text-sm font-semibold text-stone-950">
              Current references
            </p>
            <div className="mt-4 space-y-3 text-sm text-stone-700">
              <p className="rounded-xl bg-white px-4 py-3">docs/current-plan.md</p>
              <p className="rounded-xl bg-white px-4 py-3">docs/rbac-guide.md</p>
              <p className="rounded-xl bg-white px-4 py-3">
                prisma/schema.prisma
              </p>
            </div>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-white"
            >
              Back to overview
            </Link>
            <Link
              href="/event-types/new"
              className="mt-3 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Create event type
            </Link>
            <Link
              href="/bookings"
              className="mt-3 inline-flex rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-white"
            >
              View bookings
            </Link>
            <Link
              href="/settings/calendars"
              className="mt-3 inline-flex rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-white"
            >
              Calendar settings
            </Link>
            <Link
              href="/event-types"
              className="mt-3 inline-flex rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-white"
            >
              View event types
            </Link>
            <Link
              href="/settings/setup"
              className="mt-3 inline-flex rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-white"
            >
              Setup readiness
            </Link>
          </article>
        </section>

        <section className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-stone-950">
                Connected calendars
              </p>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                Live sync is available through <code>/api/calendars</code> once
                Google OAuth credentials and a real database are connected.
              </p>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-700">
              {calendars.length} stored
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {calendars.length === 0 ? (
              <p className="rounded-xl bg-white px-4 py-3 text-sm text-stone-600">
                No calendars have been synced yet.
              </p>
            ) : (
              calendars.map((calendar) => (
                <div
                  key={calendar.id}
                  className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm text-stone-700"
                >
                  <div>
                    <p className="font-medium text-stone-950">
                      {calendar.summary}
                    </p>
                    <p className="text-stone-600">
                      {calendar.externalCalendarId}
                    </p>
                  </div>
                  <div className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-stone-600">
                    {calendar.selectedForBusyCheck ? "Busy check on" : "Off"}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-stone-950">Event types</p>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                Protected API scaffolding is available through{" "}
                <code>/api/event-types</code>. The next layer is a host-side form
                and availability editor.
              </p>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-700">
              {eventTypes.length} stored
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {eventTypes.length === 0 ? (
              <p className="rounded-xl bg-white px-4 py-3 text-sm text-stone-600">
                No event types exist yet.
              </p>
            ) : (
              eventTypes.map((eventType) => (
                <div
                  key={eventType.id}
                  className="rounded-xl bg-white px-4 py-3 text-sm text-stone-700"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-stone-950">
                        {eventType.title}
                      </p>
                      <p className="text-stone-600">{eventType.slug}</p>
                    </div>
                    <div className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-stone-600">
                      {eventType.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
