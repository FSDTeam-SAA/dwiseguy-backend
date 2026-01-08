import { z } from 'zod';

export const submitQuizSchema = z.object({
      body: z.object({
            quizId: z.string().min(1, 'Quiz ID is required'),
            answers: z
                  .array(
                        z.object({
                              questionId: z.string().min(1, 'Question ID is required'), // ✅ Changed from questionText
                              selectedOption: z.string().min(1, 'Selected option is required'),
                        })
                  )
                  .length(20, 'You must answer all 20 questions'),
            timeTaken: z.number().min(1, 'Time taken is required').max(1200), // Max 20 minutes = 1200 seconds
      }),
});

export const getQuizByIdSchema = z.object({
      params: z.object({
            id: z.string().min(1, 'Quiz ID is required'),
      }),
});
