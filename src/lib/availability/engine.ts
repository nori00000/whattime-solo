import {
  addMinutes,
  eachDayOfInterval,
  endOfDay,
  isAfter,
  isBefore,
  isEqual,
  isSameDay,
  max as maxDate,
  min as minDate,
  set,
  startOfDay,
} from "date-fns";

import type {
  AvailabilityRuleInput,
  DateOverrideInput,
  Slot,
  TimeInterval,
} from "@/lib/availability/types";

function isValidInterval(interval: TimeInterval): boolean {
  return isBefore(interval.start, interval.end);
}

export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) {
    return [];
  }

  const sorted = [...intervals]
    .filter(isValidInterval)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: TimeInterval[] = [sorted[0]];

  for (const interval of sorted.slice(1)) {
    const last = merged[merged.length - 1];

    if (
      isBefore(interval.start, last.end) ||
      isEqual(interval.start, last.end)
    ) {
      last.end = maxDate([last.end, interval.end]);
      continue;
    }

    merged.push({ ...interval });
  }

  return merged;
}

export function applyBuffers(
  intervals: TimeInterval[],
  bufferBeforeMinutes: number,
  bufferAfterMinutes: number,
): TimeInterval[] {
  return mergeIntervals(
    intervals.map((interval) => ({
      start: addMinutes(interval.start, -bufferBeforeMinutes),
      end: addMinutes(interval.end, bufferAfterMinutes),
    })),
  );
}

export function buildWorkingIntervalsForDate(
  date: Date,
  rules: AvailabilityRuleInput[],
): TimeInterval[] {
  const dayOfWeek = date.getDay();

  return rules
    .filter((rule) => rule.dayOfWeek === dayOfWeek)
    .map((rule) => {
      const start = set(startOfDay(date), {
        hours: Math.floor(rule.startMinute / 60),
        minutes: rule.startMinute % 60,
        seconds: 0,
        milliseconds: 0,
      });
      const end = set(startOfDay(date), {
        hours: Math.floor(rule.endMinute / 60),
        minutes: rule.endMinute % 60,
        seconds: 0,
        milliseconds: 0,
      });

      return { start, end };
    })
    .filter(isValidInterval);
}

export function applyDateOverride(
  date: Date,
  baseIntervals: TimeInterval[],
  override?: DateOverrideInput,
): TimeInterval[] {
  if (!override) {
    return baseIntervals;
  }

  if (override.isUnavailable) {
    return [];
  }

  if (
    typeof override.startMinute === "number" &&
    typeof override.endMinute === "number"
  ) {
    return buildWorkingIntervalsForDate(date, [
      {
        dayOfWeek: date.getDay(),
        startMinute: override.startMinute,
        endMinute: override.endMinute,
      },
    ]);
  }

  return baseIntervals;
}

export function subtractBusyIntervals(
  openIntervals: TimeInterval[],
  busyIntervals: TimeInterval[],
): TimeInterval[] {
  const mergedBusy = mergeIntervals(busyIntervals);
  const result: TimeInterval[] = [];

  for (const open of openIntervals) {
    let cursor = open.start;

    for (const busy of mergedBusy) {
      if (isBefore(busy.end, open.start) || isAfter(busy.start, open.end)) {
        continue;
      }

      if (isAfter(busy.start, cursor)) {
        result.push({
          start: cursor,
          end: minDate([busy.start, open.end]),
        });
      }

      if (isAfter(busy.end, cursor)) {
        cursor = maxDate([cursor, busy.end]);
      }

      if (!isBefore(cursor, open.end)) {
        break;
      }
    }

    if (isBefore(cursor, open.end)) {
      result.push({
        start: cursor,
        end: open.end,
      });
    }
  }

  return result.filter(isValidInterval);
}

export function sliceIntoSlots(
  intervals: TimeInterval[],
  durationMinutes: number,
  slotIntervalMinutes: number,
): Slot[] {
  const slots: Slot[] = [];

  for (const interval of intervals) {
    let cursor = interval.start;

    while (
      !isAfter(addMinutes(cursor, durationMinutes), interval.end)
    ) {
      slots.push({
        start: cursor,
        end: addMinutes(cursor, durationMinutes),
      });

      cursor = addMinutes(cursor, slotIntervalMinutes);
    }
  }

  return slots;
}

export function filterSlotsByNotice(
  slots: Slot[],
  now: Date,
  minimumNoticeMinutes: number,
): Slot[] {
  const earliestAllowed = addMinutes(now, minimumNoticeMinutes);

  return slots.filter((slot) => !isBefore(slot.start, earliestAllowed));
}

export function filterBlockedSlots(
  slots: Slot[],
  blockedIntervals: TimeInterval[],
): Slot[] {
  const mergedBlocked = mergeIntervals(blockedIntervals);

  return slots.filter((slot) =>
    !mergedBlocked.some(
      (blocked) =>
        isBefore(slot.start, blocked.end) && isAfter(slot.end, blocked.start),
    ),
  );
}

export function buildDateRange(from: Date, to: Date): Date[] {
  return eachDayOfInterval({
    start: startOfDay(from),
    end: endOfDay(to),
  });
}

export function findDateOverride(
  date: Date,
  overrides: DateOverrideInput[],
): DateOverrideInput | undefined {
  return overrides.find((override) => isSameDay(override.date, date));
}

export function computeAvailableSlots(input: {
  from: Date;
  to: Date;
  now: Date;
  durationMinutes: number;
  slotIntervalMinutes: number;
  minimumNoticeMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  rules: AvailabilityRuleInput[];
  overrides: DateOverrideInput[];
  busyIntervals: TimeInterval[];
  blockedIntervals?: TimeInterval[];
}): Slot[] {
  const dates = buildDateRange(input.from, input.to);
  const bufferedBusy = applyBuffers(
    input.busyIntervals,
    input.bufferBeforeMinutes,
    input.bufferAfterMinutes,
  );
  const blocked = input.blockedIntervals ?? [];
  const slots: Slot[] = [];

  for (const date of dates) {
    const baseIntervals = buildWorkingIntervalsForDate(date, input.rules);
    const intervals = applyDateOverride(
      date,
      baseIntervals,
      findDateOverride(date, input.overrides),
    );
    const freeIntervals = subtractBusyIntervals(intervals, bufferedBusy);
    const dateSlots = sliceIntoSlots(
      freeIntervals,
      input.durationMinutes,
      input.slotIntervalMinutes,
    );

    slots.push(...dateSlots);
  }

  return filterBlockedSlots(
    filterSlotsByNotice(slots, input.now, input.minimumNoticeMinutes),
    blocked,
  );
}
