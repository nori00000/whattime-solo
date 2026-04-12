import { z } from "zod";

export const availabilityRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
});

export const eventTypeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  durationMinutes: z.number().int().min(15).max(480),
  bufferBeforeMinutes: z.number().int().min(0).max(240).default(0),
  bufferAfterMinutes: z.number().int().min(0).max(240).default(0),
  bookingWindowStartDays: z.number().int().min(0).max(365).default(0),
  bookingWindowEndDays: z.number().int().min(1).max(365).default(30),
  minimumNoticeMinutes: z.number().int().min(0).max(43200).default(60),
  slotIntervalMinutes: z.number().int().min(5).max(240).default(30),
  isActive: z.boolean().default(true),
  availabilityRules: z.array(availabilityRuleSchema).min(1),
});

export type EventTypeInput = z.infer<typeof eventTypeSchema>;
