import Link from "next/link";

import { requireHostPageSession } from "@/lib/auth/server-session";
import { CalendarSelectionPanel } from "@/components/settings/calendar-selection-panel";
import { listConnectedCalendars } from "@/server/services/calendar-service";

export default async function CalendarSettingsPage() {
  const host = await requireHostPageSession();
  const calendars = await listConnectedCalendars(host.userId);

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Calendar Settings
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
            Choose which calendars block your availability
          </h1>
          <p className="mt-4 text-base leading-8 text-stone-600">
            These settings determine the busy intervals that the public booking
            page respects. If the wrong calendars are selected, the slot engine
            will appear incorrect even when the logic is fine.
          </p>
        </section>

        <CalendarSelectionPanel initialCalendars={calendars} />

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-white"
          >
            Back to dashboard
          </Link>
          <Link
            href="/event-types/new"
            className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Create event type
          </Link>
        </div>
      </div>
    </main>
  );
}
