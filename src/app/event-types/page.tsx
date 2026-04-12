import Link from "next/link";

import { requireHostPageSession } from "@/lib/auth/server-session";
import { listEventTypes } from "@/server/services/event-type-service";

export default async function EventTypesPage() {
  const host = await requireHostPageSession();
  const eventTypes = await listEventTypes(host.userId);

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Event Types
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
            Manage your booking templates
          </h1>
          <p className="mt-4 text-base leading-8 text-stone-600">
            This page lets you review all stored event types and jump directly
            into editing the ones you already created.
          </p>
        </section>

        <section className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-stone-950">Stored event types</p>
            <Link
              href="/event-types/new"
              className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Create event type
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {eventTypes.length === 0 ? (
              <p className="rounded-xl bg-white px-4 py-3 text-sm text-stone-600">
                No event types exist yet.
              </p>
            ) : (
              eventTypes.map((eventType) => (
                <article
                  key={eventType.id}
                  className="rounded-xl bg-white px-4 py-4 text-sm text-stone-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-stone-950">
                        {eventType.title}
                      </p>
                      <p className="mt-1 text-stone-600">{eventType.slug}</p>
                      <p className="mt-2 text-stone-600">
                        {eventType.durationMinutes} min · notice{" "}
                        {eventType.minimumNoticeMinutes} min · buffer{" "}
                        {eventType.bufferBeforeMinutes}/{eventType.bufferAfterMinutes} min
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-stone-600">
                        {eventType.isActive ? "Active" : "Inactive"}
                      </div>
                      <Link
                        href={`/event-types/${eventType.id}/edit`}
                        className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
