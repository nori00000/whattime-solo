import { format } from "date-fns";

import { PublicBookingForm } from "@/components/booking/public-booking-form";
import { getPublicAvailability } from "@/server/services/availability-service";

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicBookingPage({ params }: Params) {
  const resolvedParams = await params;
  const availability = await getPublicAvailability({
    slug: resolvedParams.slug,
  }).catch(() => null);

  if (!availability) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6 py-12 text-stone-900">
        <section className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)] sm:p-10">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
            Booking page not available
          </h1>
          <p className="mt-4 text-base leading-8 text-stone-600">
            This event type does not exist yet or the host has not finished
            configuring scheduling.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="rounded-[2rem] bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Public Booking Page
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
            {availability.eventType.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-stone-600">
            {availability.eventType.description ??
              "The public booking surface is now connected to the availability engine. Booking confirmation will be added next."}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Duration
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-950">
                {availability.eventType.durationMinutes} minutes
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Host timezone
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-950">
                {availability.eventType.timezone}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Host
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-950">
                {availability.eventType.hostName ?? "Host"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-stone-950">
                Available slots
              </p>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                These slots already reflect event-type rules, stored bookings,
                active booking locks, and any synced Google busy intervals.
              </p>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-700">
              {availability.slots.length} found
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {availability.slots.length === 0 ? (
              <p className="rounded-xl bg-white px-4 py-3 text-sm text-stone-600">
                No bookable slots are currently available in the queried window.
              </p>
            ) : (
              availability.slots.slice(0, 18).map((slot) => (
                <div
                  key={slot.start.toISOString()}
                  className="rounded-xl bg-white px-4 py-3 text-sm text-stone-700"
                >
                  <p className="font-medium text-stone-950">
                    {format(slot.start, "yyyy-MM-dd HH:mm")}
                  </p>
                  <p className="mt-1 text-stone-600">
                    Ends {format(slot.end, "HH:mm")}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <PublicBookingForm
          slug={resolvedParams.slug}
          timezone={availability.eventType.timezone}
          slots={availability.slots.slice(0, 24).map((slot) => ({
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
            displayLabel: `${format(slot.start, "yyyy-MM-dd HH:mm")} - ${format(
              slot.end,
              "HH:mm",
            )}`,
          }))}
        />
      </div>
    </main>
  );
}
