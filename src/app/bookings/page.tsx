import Link from "next/link";
import { format } from "date-fns";

import { requireHostPageSession } from "@/lib/auth/server-session";
import { listHostBookings } from "@/server/services/host-booking-service";

export default async function BookingsPage() {
  const host = await requireHostPageSession();
  const bookings = await listHostBookings(host.userId);

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Host Bookings
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
            Upcoming and historical reservations
          </h1>
          <p className="mt-4 text-base leading-8 text-stone-600">
            This page is the first host-side reservation view. It gives you a
            direct way to inspect stored booking state before adding richer
            filters or manual management actions.
          </p>
        </section>

        <section className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-stone-950">Stored bookings</p>
            <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-700">
              {bookings.length} total
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {bookings.length === 0 ? (
              <p className="rounded-xl bg-white px-4 py-3 text-sm text-stone-600">
                No bookings have been stored yet.
              </p>
            ) : (
              bookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-xl bg-white px-4 py-4 text-sm text-stone-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-stone-950">
                        {booking.inviteeName} · {booking.inviteeEmail}
                      </p>
                      <p className="mt-1 text-stone-600">
                        {booking.eventType.title}
                      </p>
                      <p className="mt-2 text-stone-600">
                        {format(booking.startAtUtc, "yyyy-MM-dd HH:mm")} to{" "}
                        {format(booking.endAtUtc, "HH:mm")}
                      </p>
                    </div>
                    <div className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-stone-600">
                      {booking.status}
                    </div>
                  </div>
                  <Link
                    href={`/bookings/${booking.id}`}
                    className="mt-4 inline-flex rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
                  >
                    View detail
                  </Link>
                </article>
              ))
            )}
          </div>
        </section>

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
            Create another event type
          </Link>
        </div>
      </div>
    </main>
  );
}
