import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { HostBookingActions } from "@/components/bookings/host-booking-actions";
import { requireHostPageSession } from "@/lib/auth/server-session";
import { getHostBooking } from "@/server/services/host-booking-service";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BookingDetailPage({ params }: Params) {
  const host = await requireHostPageSession();
  const resolvedParams = await params;
  const booking = await getHostBooking(host.userId, resolvedParams.id);

  if (!booking) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Booking Detail
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
            {booking.inviteeName}
          </h1>
          <p className="mt-4 text-base leading-8 text-stone-600">
            {booking.eventType.title} · {booking.inviteeEmail}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
            <p className="text-sm font-semibold text-stone-950">Schedule</p>
            <div className="mt-4 space-y-3 text-sm text-stone-700">
              <p className="rounded-xl bg-white px-4 py-3">
                Starts: {format(booking.startAtUtc, "yyyy-MM-dd HH:mm")}
              </p>
              <p className="rounded-xl bg-white px-4 py-3">
                Ends: {format(booking.endAtUtc, "yyyy-MM-dd HH:mm")}
              </p>
              <p className="rounded-xl bg-white px-4 py-3">
                Invitee timezone: {booking.inviteeTimezone}
              </p>
              <p className="rounded-xl bg-white px-4 py-3">
                Status: {booking.status}
              </p>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
            <p className="text-sm font-semibold text-stone-950">Metadata</p>
            <div className="mt-4 space-y-3 text-sm text-stone-700">
              <p className="rounded-xl bg-white px-4 py-3">
                Event type slug: {booking.eventType.slug}
              </p>
              <p className="rounded-xl bg-white px-4 py-3">
                External event: {booking.externalEventId ?? "Not created"}
              </p>
              <p className="rounded-xl bg-white px-4 py-3">
                Cancel token: {booking.cancelToken}
              </p>
            </div>
          </article>
        </section>

        <HostBookingActions
          bookingId={booking.id}
          initialStatus={booking.status}
        />

        <div className="flex flex-wrap gap-3">
          <Link
            href="/bookings"
            className="inline-flex rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-white"
          >
            Back to bookings
          </Link>
          <Link
            href={`/${booking.eventType.slug}`}
            className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Open public page
          </Link>
        </div>
      </div>
    </main>
  );
}
