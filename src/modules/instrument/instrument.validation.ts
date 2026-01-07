import { z } from 'zod';

// For referencing lessons by ObjectId
const moduleRefSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid lesson ID');

// Create Course Schema
export const createInstrumentSchema = z.object({
      body: z.object({
            instrumentImage: z.string().min(2),
            courseDescription: z.string().min(10),
            courseImage: z.string().url().optional(),
            level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
            lessons: z.array(moduleRefSchema).optional(),
      }),
});

// Update Course Schema
export const updateInstrumentSchema = z.object({
      body: z
            .object({
                  instrumentImage: z.string().min(2).optional(),
                  courseDescription: z.string().min(10).optional(),
                  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),

                  // Preprocess isActive from FormData
                  isActive: z
                        .preprocess(
                              (val) => {
                                    if (typeof val === 'string') {
                                          if (val === 'true') return true;
                                          if (val === 'false') return false;
                                    }
                                    return val;
                              },
                              z.boolean({ invalid_type_error: 'isActive must be true or false' })
                        )
                        .optional(),
            })
            .refine((data) => Object.keys(data).length > 0, {
                  message: 'At least one field must be updated',
            }),
});
