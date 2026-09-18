import { parseDuration } from '@/shared/lib/duration'
import { z } from 'zod'

/** Saisie de temps : mêmes règles que TimeEntryRequest côté serveur (1 min – 24 h, 500 car.). */
export const timeEntryFormSchema = z.object({
  workDate: z.string().min(1, 'validation.time.date'),
  duration: z.string().refine((value) => parseDuration(value) !== null, 'validation.time.duration'),
  note: z.string().trim().max(500, 'validation.time.note'),
})

export type TimeEntryFormValues = z.infer<typeof timeEntryFormSchema>
