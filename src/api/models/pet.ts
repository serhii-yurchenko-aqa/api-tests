import { z } from 'zod';

export const PetSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.string().optional(),
  category: z.object({ id: z.number().optional(), name: z.string().optional() }).optional(),
  photoUrls: z.array(z.string()).optional(),
  tags: z.array(z.object({ id: z.number().optional(), name: z.string().optional() })).optional(),
});
export type Pet = z.infer<typeof PetSchema>;
