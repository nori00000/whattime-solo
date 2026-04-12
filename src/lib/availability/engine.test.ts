import { describe, expect, it } from "vitest";

import {
  applyBuffers,
  buildWorkingIntervalsForDate,
  computeAvailableSlots,
  mergeIntervals,
  subtractBusyIntervals,
} from "./engine";

describe("availability engine", () => {
  it("merges overlapping intervals", () => {
    const merged = mergeIntervals([
      {
        start: new Date("2026-04-15T01:00:00.000Z"),
        end: new Date("2026-04-15T02:00:00.000Z"),
      },
      {
        start: new Date("2026-04-15T01:30:00.000Z"),
        end: new Date("2026-04-15T03:00:00.000Z"),
      },
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].start.toISOString()).toBe("2026-04-15T01:00:00.000Z");
    expect(merged[0].end.toISOString()).toBe("2026-04-15T03:00:00.000Z");
  });

  it("applies buffers to busy intervals", () => {
    const buffered = applyBuffers(
      [
        {
          start: new Date("2026-04-15T01:00:00.000Z"),
          end: new Date("2026-04-15T02:00:00.000Z"),
        },
      ],
      15,
      30,
    );

    expect(buffered[0].start.toISOString()).toBe("2026-04-15T00:45:00.000Z");
    expect(buffered[0].end.toISOString()).toBe("2026-04-15T02:30:00.000Z");
  });

  it("builds working intervals from weekday rules", () => {
    const intervals = buildWorkingIntervalsForDate(
      new Date("2026-04-13T00:00:00.000Z"),
      [{ dayOfWeek: 1, startMinute: 600, endMinute: 720 }],
    );

    expect(intervals).toHaveLength(1);
    expect(intervals[0].start.toISOString()).toBe("2026-04-13T01:00:00.000Z");
    expect(intervals[0].end.toISOString()).toBe("2026-04-13T03:00:00.000Z");
  });

  it("subtracts busy intervals from open intervals", () => {
    const remaining = subtractBusyIntervals(
      [
        {
          start: new Date("2026-04-15T01:00:00.000Z"),
          end: new Date("2026-04-15T05:00:00.000Z"),
        },
      ],
      [
        {
          start: new Date("2026-04-15T02:00:00.000Z"),
          end: new Date("2026-04-15T03:00:00.000Z"),
        },
      ],
    );

    expect(remaining).toHaveLength(2);
    expect(remaining[0].end.toISOString()).toBe("2026-04-15T02:00:00.000Z");
    expect(remaining[1].start.toISOString()).toBe("2026-04-15T03:00:00.000Z");
  });

  it("computes slots while removing busy, blocked, and too-soon times", () => {
    const slots = computeAvailableSlots({
      from: new Date("2026-04-13T00:00:00.000Z"),
      to: new Date("2026-04-13T00:00:00.000Z"),
      now: new Date("2026-04-12T23:00:00.000Z"),
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      minimumNoticeMinutes: 60,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      rules: [{ dayOfWeek: 1, startMinute: 600, endMinute: 720 }],
      overrides: [],
      busyIntervals: [
        {
          start: new Date("2026-04-13T01:30:00.000Z"),
          end: new Date("2026-04-13T02:00:00.000Z"),
        },
      ],
      blockedIntervals: [
        {
          start: new Date("2026-04-13T02:30:00.000Z"),
          end: new Date("2026-04-13T03:00:00.000Z"),
        },
      ],
    });

    expect(slots.map((slot) => slot.start.toISOString())).toEqual([
      "2026-04-13T01:00:00.000Z",
      "2026-04-13T02:00:00.000Z",
    ]);
  });
});
