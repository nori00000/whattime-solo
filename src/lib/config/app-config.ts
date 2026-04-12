export const APP_CONFIG = {
  name: "WhatTime Solo",
  description:
    "Personal scheduling service for a single host using Google Calendar availability.",
  hostTimezone: "Asia/Seoul",
  defaultSlotIntervalMinutes: 30,
  defaultMinimumNoticeMinutes: 60,
  defaultBookingWindowEndDays: 30,
  bookingLockTtlSeconds: 180,
} as const;
