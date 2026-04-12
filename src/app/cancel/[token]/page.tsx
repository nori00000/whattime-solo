import { format } from "date-fns";

import { getBookingByToken } from "@/server/services/booking-service";

type Params = {
  params: Promise<{
    token: string;
  }>;
};

export default async function CancelBookingPage({ params }: Params) {
  const resolvedParams = await params;
  const booking = await getBookingByToken(resolvedParams.token);

  if (!booking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6 py-12 text-stone-900">
        <section className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)] sm:p-10">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
            Cancellation link not found
          </h1>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6 py-12 text-stone-900">
      <section className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)] sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Booking Cancellation
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
          {booking.eventType.title}
        </h1>
        <p className="mt-4 text-base leading-8 text-stone-600">
          {booking.inviteeName}, this booking can be canceled through the API at{" "}
          <code>/api/public/cancel/{resolvedParams.token}</code>.
        </p>
        <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm leading-7 text-stone-700">
          Starts: {format(booking.startAtUtc, "yyyy-MM-dd HH:mm")}
          <br />
          Ends: {format(booking.endAtUtc, "yyyy-MM-dd HH:mm")}
          <br />
          Status: {booking.status}
        </div>
      </section>
    </main>
  );
}
