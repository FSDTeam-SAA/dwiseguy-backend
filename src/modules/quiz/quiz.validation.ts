import { z } from 'zod';

const optionSchema = z.object({
      optionText: z.string().min(1, 'Option text is required'),
      isCorrect: z.boolean(),
});

const questionSchema = z.object({
      questionText: z.string().min(1, 'Question text is required'),
      options: z
            .array(optionSchema)
            .length(4, 'Each question must have exactly 4 options')
            .refine(
                  (options) => {
                        // Check exactly one correct option
                        const correctCount = options.filter((opt) => opt.isCorrect).length;
                        return correctCount === 1;
                  },
                  { message: 'Each question must have exactly 1 correct option' }
            )
            .refine(
                  (options) => {
                        // Check all options are unique
                        const optionTexts = options.map((opt) => opt.optionText.toLowerCase().trim());
                        const uniqueOptions = new Set(optionTexts);
                        return uniqueOptions.size === optionTexts.length;
                  },
                  { message: 'All options must be unique within a question' }
            ),
      // explanation: z.string().optional(), // TODO: Add later if needed
});

export const createQuizSchema = z.object({
      body: z.object({
            quizName: z.string().min(3, 'Quiz name must be at least 3 characters').trim(),
            lessonId: z.string().min(1, 'Lesson ID is required'), // TODO: Uncomment when Lesson model is ready
            classId: z.string().min(1, 'Class ID is required'), // TODO: Uncomment when Class model is ready
            questions: z
                  .array(questionSchema)
                  .length(20, 'Quiz must have exactly 20 questions')
                  .refine(
                        (questions) => {
                              // Check all question texts are unique
                              const questionTexts = questions.map((q) => q.questionText.toLowerCase().trim());
                              const uniqueQuestions = new Set(questionTexts);
                              return uniqueQuestions.size === questionTexts.length;
                        },
                        { message: 'All question texts must be unique within the quiz' }
                  ),
            timeLimit: z.number().min(1).max(120).optional().default(20), // 1-120 minutes, default 20
      }),
});

export const updateQuizSchema = z.object({
      body: z.object({
            quizName: z.string().min(3, 'Quiz name must be at least 3 characters').trim().optional(),
            questions: z
                  .array(questionSchema)
                  .length(20, 'Quiz must have exactly 20 questions')
                  .refine(
                        (questions) => {
                              // Check all question texts are unique
                              const questionTexts = questions.map((q) => q.questionText.toLowerCase().trim());
                              const uniqueQuestions = new Set(questionTexts);
                              return uniqueQuestions.size === questionTexts.length;
                        },
                        { message: 'All question texts must be unique within the quiz' }
                  )
                  .optional(),
            timeLimit: z.number().min(1).max(120).optional(),
      }),
});

export const submitQuizSchema = z.object({
      body: z.object({
            quizId: z.string().min(1, 'Quiz ID is required'),
            answers: z
                  .array(
                        z.object({
                              questionText: z.string().min(1, 'Question text is required'),
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
