import { z } from 'zod';
import mongoose from 'mongoose';

export const createExerciseContentSchema = z.object({
      body: z.object({
            value: z.object({
                  title: z
                        .string({ required_error: 'Title is required' })
                        .min(2, 'Title must be at least 2 characters'),

                  description: z
                        .string({ required_error: 'Description is required' })
                        .min(10, 'Description must be at least 10 characters'),

                  exerciseId: z
                        .string({ required_error: 'Exercise ID is required' })
                        .refine((id) => mongoose.Types.ObjectId.isValid(id), {
                              message: 'Exercise ID must be a valid MongoDB ObjectId',
                        }),
                  lessonId: z
                        .string({ required_error: 'Lession ID is required' })
                        .refine((id) => mongoose.Types.ObjectId.isValid(id), {
                              message: 'Lession ID must be a valid MongoDB ObjectId',
                        }),
                  keyNotes: z.preprocess((val) => {
                        // In case form-data sends a single string instead of array
                        if (typeof val === 'string') return [val];
                        return val;
                  }, z.array(z.string()).nonempty('At least one keyNote is required')),
            }),
      }),
})

export const updateExerciseContentSchema = z.object({
      body: z.object({
            value: z
                  .object({
                        title: z
                              .string({ required_error: 'Title is required' })
                              .min(2, 'Title must be at least 2 characters'),

                        description: z
                              .string({ required_error: 'Description is required' })
                              .min(10, 'Description must be at least 10 characters'),

                        keyNotes: z.preprocess((val) => {
                              // If form-data sends a single string instead of array
                              if (typeof val === 'string') return [val];
                              return val;
                        }, z.array(z.string()).nonempty('At least one keyNote is required')),
                  })
                  .strict(),
      }),
});
