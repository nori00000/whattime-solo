"use client";

import { useState } from "react";

type Slot = {
  start: string;
  end: string;
  displayLabel: string;
};

type Props = {
  slug: string;
  timezone: string;
  slots: Slot[];
};

export function PublicBookingForm({ slug, timezone, slots }: Props) {
  const [selectedSlot, setSelectedSlot] = useState(slots[0]?.start ?? "");
  const [inviteeName, setInviteeName] = useState("");
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const response = await fetch(`/api/public/${slug}/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slotStart: selectedSlot,
        timezone,
        inviteeName,
        inviteeEmail,
        note,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.message ?? "Booking failed.");
      setIsSubmitting(false);
      return;
    }

    setStatus(
      `Booking confirmed. Cancellation token: ${data.booking.cancelToken}`,
    );
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
      <div>
        <label className="text-sm font-medium text-stone-900" htmlFor="slotStart">
          Slot
        </label>
        <select
          id="slotStart"
          value={selectedSlot}
          onChange={(event) => setSelectedSlot(event.target.value)}
          className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
          required
        >
          {slots.map((slot) => (
            <option key={slot.start} value={slot.start}>
              {slot.displayLabel}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-stone-900" htmlFor="inviteeName">
          Name
        </label>
        <input
          id="inviteeName"
          value={inviteeName}
          onChange={(event) => setInviteeName(event.target.value)}
          className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-stone-900" htmlFor="inviteeEmail">
          Email
        </label>
        <input
          id="inviteeEmail"
          type="email"
          value={inviteeEmail}
          onChange={(event) => setInviteeEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-stone-900" htmlFor="note">
          Note
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="mt-2 min-h-28 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !selectedSlot}
        className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      >
        {isSubmitting ? "Booking..." : "Confirm booking"}
      </button>

      {status ? (
        <p className="rounded-xl bg-white px-4 py-3 text-sm text-stone-700">
          {status}
        </p>
      ) : null}
    </form>
  );
}
