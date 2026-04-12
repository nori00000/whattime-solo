import { addMinutes } from "date-fns";

export function createBookingSlot(startIso: string, durationMinutes = 30) {
  const start = new Date(startIso);

  return {
    start,
    end: addMinutes(start, durationMinutes),
  };
}
