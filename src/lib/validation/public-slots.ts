import { z } from "zod";

export const publicSlotsQuerySchema = z.object({
  from: z
    .string()
    .datetime({ offset: true })
    .optional(),
  to: z
    .string()
    .datetime({ offset: true })
    .optional(),
});

export type PublicSlotsQuery = z.infer<typeof publicSlotsQuerySchema>;
