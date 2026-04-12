"use client";

import { useState } from "react";

const defaultRules = [
  { dayOfWeek: 1, startMinute: 600, endMinute: 1080 },
  { dayOfWeek: 2, startMinute: 600, endMinute: 1080 },
  { dayOfWeek: 3, startMinute: 600, endMinute: 1080 },
  { dayOfWeek: 4, startMinute: 600, endMinute: 1080 },
  { dayOfWeek: 5, startMinute: 600, endMinute: 1080 },
];

type EventTypeFormInitialValues = {
  title: string;
  description: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minimumNoticeMinutes: number;
};

type Props = {
  mode: "create" | "edit";
  eventTypeId?: string;
  initialValues?: Partial<EventTypeFormInitialValues>;
};

export function EventTypeForm({
  mode,
  eventTypeId,
  initialValues,
}: Props) {
  const [title, setTitle] = useState(
    initialValues?.title ?? "30-minute intro call",
  );
  const [description, setDescription] = useState(
    initialValues?.description ?? "Short introduction meeting",
  );
  const [durationMinutes, setDurationMinutes] = useState(
    initialValues?.durationMinutes ?? 30,
  );
  const [bufferBeforeMinutes, setBufferBeforeMinutes] = useState(
    initialValues?.bufferBeforeMinutes ?? 10,
  );
  const [bufferAfterMinutes, setBufferAfterMinutes] = useState(
    initialValues?.bufferAfterMinutes ?? 15,
  );
  const [minimumNoticeMinutes, setMinimumNoticeMinutes] = useState(
    initialValues?.minimumNoticeMinutes ?? 120,
  );
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const response = await fetch(
      mode === "create" ? "/api/event-types" : `/api/event-types/${eventTypeId}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          durationMinutes,
          bufferBeforeMinutes,
          bufferAfterMinutes,
          bookingWindowStartDays: 0,
          bookingWindowEndDays: 14,
          minimumNoticeMinutes,
          slotIntervalMinutes: 30,
          isActive: true,
          availabilityRules: defaultRules,
        }),
      },
    );
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.message ?? "Failed to save event type.");
      setIsSubmitting(false);
      return;
    }

    setStatus(
      mode === "create"
        ? `Created event type: ${data.eventType.slug}`
        : `Updated event type: ${data.eventType.slug}`,
    );
    setIsSubmitting(false);
  }

  const actionLabel = mode === "create" ? "Create event type" : "Save changes";

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-5 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6"
    >
      <div>
        <label className="text-sm font-medium text-stone-900" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
          required
        />
      </div>

      <div>
        <label
          className="text-sm font-medium text-stone-900"
          htmlFor="description"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-2 min-h-28 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label
            className="text-sm font-medium text-stone-900"
            htmlFor="durationMinutes"
          >
            Duration
          </label>
          <input
            id="durationMinutes"
            type="number"
            min={15}
            step={15}
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
            required
          />
        </div>

        <div>
          <label
            className="text-sm font-medium text-stone-900"
            htmlFor="bufferBeforeMinutes"
          >
            Buffer before
          </label>
          <input
            id="bufferBeforeMinutes"
            type="number"
            min={0}
            step={5}
            value={bufferBeforeMinutes}
            onChange={(event) =>
              setBufferBeforeMinutes(Number(event.target.value))
            }
            className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
            required
          />
        </div>

        <div>
          <label
            className="text-sm font-medium text-stone-900"
            htmlFor="bufferAfterMinutes"
          >
            Buffer after
          </label>
          <input
            id="bufferAfterMinutes"
            type="number"
            min={0}
            step={5}
            value={bufferAfterMinutes}
            onChange={(event) =>
              setBufferAfterMinutes(Number(event.target.value))
            }
            className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
            required
          />
        </div>

        <div>
          <label
            className="text-sm font-medium text-stone-900"
            htmlFor="minimumNoticeMinutes"
          >
            Minimum notice
          </label>
          <input
            id="minimumNoticeMinutes"
            type="number"
            min={0}
            step={15}
            value={minimumNoticeMinutes}
            onChange={(event) =>
              setMinimumNoticeMinutes(Number(event.target.value))
            }
            className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900"
            required
          />
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-7 text-stone-700">
        This starter form uses weekday availability from 10:00 to 18:00,
        a 14-day booking window, a 30-minute slot interval, and default
        buffers that prevent back-to-back bookings from stacking too tightly.
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      >
        {isSubmitting ? "Saving..." : actionLabel}
      </button>

      {status ? (
        <p className="rounded-xl bg-white px-4 py-3 text-sm text-stone-700">
          {status}
        </p>
      ) : null}
    </form>
  );
}
