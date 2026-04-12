"use client";

import { useState } from "react";

type Props = {
  bookingId: string;
  initialStatus: string;
};

export function HostBookingActions({ bookingId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function cancelBooking() {
    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message ?? "Failed to cancel booking.");
      setIsSubmitting(false);
      return;
    }

    setStatus(data.booking.status);
    setMessage("Booking canceled.");
    setIsSubmitting(false);
  }

  return (
    <section className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
      <p className="text-sm font-semibold text-stone-950">Host actions</p>
      <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-stone-700">
        Current status: <span className="font-medium text-stone-950">{status}</span>
      </div>

      <div className="mt-4">
        <label
          htmlFor="cancelReason"
          className="text-sm font-medium text-stone-900"
        >
          Cancellation reason
        </label>
        <textarea
          id="cancelReason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-2 min-h-28 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
        />
      </div>

      <button
        type="button"
        onClick={cancelBooking}
        disabled={isSubmitting || status !== "CONFIRMED"}
        className="mt-4 rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      >
        {isSubmitting ? "Canceling..." : "Cancel booking"}
      </button>

      {message ? (
        <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-stone-700">
          {message}
        </p>
      ) : null}
    </section>
  );
}
