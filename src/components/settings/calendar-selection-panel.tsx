"use client";

import { useMemo, useState } from "react";

type CalendarItem = {
  id: string;
  externalCalendarId: string;
  summary: string;
  isPrimary: boolean;
  selectedForBusyCheck: boolean;
};

type Props = {
  initialCalendars: CalendarItem[];
};

export function CalendarSelectionPanel({ initialCalendars }: Props) {
  const [calendars, setCalendars] = useState(initialCalendars);
  const [status, setStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);

  const selectedCount = useMemo(
    () => calendars.filter((calendar) => calendar.selectedForBusyCheck).length,
    [calendars],
  );

  async function syncCalendars() {
    setIsSyncing(true);
    setStatus(null);

    const response = await fetch("/api/calendars", {
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.message ?? "Failed to sync calendars.");
      setIsSyncing(false);
      return;
    }

    setCalendars(data.calendars);
    setStatus("Calendars synced.");
    setIsSyncing(false);
  }

  async function toggleCalendar(id: string, selectedForBusyCheck: boolean) {
    setUpdatingIds((current) => [...current, id]);
    setStatus(null);

    const response = await fetch(`/api/calendars/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ selectedForBusyCheck }),
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.message ?? "Failed to update calendar selection.");
      setUpdatingIds((current) => current.filter((item) => item !== id));
      return;
    }

    setCalendars((current) =>
      current.map((calendar) =>
        calendar.id === id ? data.calendar : calendar,
      ),
    );
    setUpdatingIds((current) => current.filter((item) => item !== id));
  }

  return (
    <section className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-stone-950">
            Busy-check calendars
          </p>
          <p className="mt-2 text-sm leading-7 text-stone-600">
            Only selected calendars will block bookable time. Start with a sync,
            then turn calendars on or off.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-700">
            {selectedCount} selected
          </div>
          <button
            type="button"
            onClick={syncCalendars}
            disabled={isSyncing}
            className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {isSyncing ? "Syncing..." : "Sync calendars"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {calendars.length === 0 ? (
          <p className="rounded-xl bg-white px-4 py-3 text-sm text-stone-600">
            No calendars stored yet. Run sync after connecting Google.
          </p>
        ) : (
          calendars.map((calendar) => {
            const isUpdating = updatingIds.includes(calendar.id);

            return (
              <label
                key={calendar.id}
                className="flex items-start justify-between gap-4 rounded-xl bg-white px-4 py-4 text-sm text-stone-700"
              >
                <div>
                  <p className="font-medium text-stone-950">
                    {calendar.summary}
                  </p>
                  <p className="mt-1 text-stone-600">
                    {calendar.externalCalendarId}
                  </p>
                  {calendar.isPrimary ? (
                    <p className="mt-2 inline-flex rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-stone-600">
                      Primary
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
                    Busy check
                  </span>
                  <input
                    type="checkbox"
                    checked={calendar.selectedForBusyCheck}
                    disabled={isUpdating}
                    onChange={(event) =>
                      toggleCalendar(calendar.id, event.target.checked)
                    }
                    className="h-5 w-5 rounded border-stone-300"
                  />
                </div>
              </label>
            );
          })
        )}
      </div>

      {status ? (
        <p className="mt-5 rounded-xl bg-white px-4 py-3 text-sm text-stone-700">
          {status}
        </p>
      ) : null}
    </section>
  );
}
