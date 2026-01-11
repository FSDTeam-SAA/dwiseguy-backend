import { z } from 'zod';

export const createExerciseSchema = z.object({
      body: z.object({
            title: z.string({ required_error: 'Title is required' }).min(2),

            description: z.string({ required_error: 'Description is required' }).min(10),
      }),
});
