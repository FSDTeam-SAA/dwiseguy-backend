import { z } from 'zod';

// For referencing lessons by ObjectId
const lessonRefSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid lesson ID');

// Create Course Schema
export const createCourseSchema = z.object({
      body: z.object({
            courseTitle: z.string().min(2),
            courseDescription: z.string().min(10),
            courseImage: z.string().url().optional(),
            level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
            lessons: z.array(lessonRefSchema).optional(),
      }),
});

// Update Course Schema
export const updateCourseSchema = z.object({
      courseTitle: z.string().min(2),
      courseDescription: z.string().min(10),
      courseImage: z.string().url().optional(),
      level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      lessons: z.array(lessonRefSchema).optional(),
});
