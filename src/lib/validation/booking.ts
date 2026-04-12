import { z } from "zod";

export const createBookingSchema = z.object({
  slotStart: z.string().datetime({ offset: true }),
  timezone: z.string().min(1),
  inviteeName: z.string().trim().min(1).max(120),
  inviteeEmail: z.string().email(),
  note: z.string().trim().max(2000).optional().nullable(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(500).optional().nullable(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
