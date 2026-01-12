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
                        const correctCount = options.filter((opt) => opt.isCorrect).length;
                        return correctCount === 1;
                  },
                  { message: 'Each question must have exactly 1 correct option' }
            )
            .refine(
                  (options) => {
                        const optionTexts = options.map((opt) => opt.optionText.toLowerCase().trim());
                        const uniqueOptions = new Set(optionTexts);
                        return uniqueOptions.size === optionTexts.length;
                  },
                  { message: 'All options must be unique within a question' }
            ),
});

export const createQuizSchema = z.object({
      body: z
            .object({
                  quizName: z.string().min(3, 'Quiz name must be at least 3 characters').trim(),
                  moduleId: z.string().min(1, 'Module ID is required'), // ✅ Changed from classId
                  // lessonId: z.string().min(1, 'Lesson ID is required'), // TODO: Uncomment when Lesson model is ready
                  questions: z
                        .array(questionSchema)
                        .min(20, 'Quiz must have at least 20 questions') // ✅ Changed
                        .max(50, 'Quiz must have at most 50 questions') // ✅ Changed
                        .refine(
                              (questions) => {
                                    const questionTexts = questions.map((q) => q.questionText.toLowerCase().trim());
                                    const uniqueQuestions = new Set(questionTexts);
                                    return uniqueQuestions.size === questionTexts.length;
                              },
                              { message: 'All question texts must be unique within the quiz' }
                        ),
                  numberOfQuestionsToShow: z.number().int().min(20).max(50), // ✅ NEW
                  timeLimit: z.number().min(1).max(120).optional().default(20),
                  passingPercentage: z.number().min(0).max(100).optional().default(75), // ✅ NEW
            })
            .refine(
                  (data) => {
                        // ✅ Validate numberOfQuestionsToShow <= total questions
                        return data.numberOfQuestionsToShow <= data.questions.length;
                  },
                  {
                        message: 'numberOfQuestionsToShow cannot be greater than total questions',
                        path: ['numberOfQuestionsToShow'],
                  }
            ),
});

export const updateQuizSchema = z.object({
      body: z.object({
            quizName: z.string().min(3, 'Quiz name must be at least 3 characters').trim().optional(),
            moduleId: z.string().min(1, 'Module ID is required').optional(), // ✅ Changed
            // lessonId: z.string().min(1, 'Lesson ID is required').optional(), // TODO: Uncomment when needed
            questions: z
                  .array(questionSchema)
                  .min(20, 'Quiz must have at least 20 questions') // ✅ Changed
                  .max(50, 'Quiz must have at most 50 questions') // ✅ Changed
                  .refine(
                        (questions) => {
                              const questionTexts = questions.map((q) => q.questionText.toLowerCase().trim());
                              const uniqueQuestions = new Set(questionTexts);
                              return uniqueQuestions.size === questionTexts.length;
                        },
                        { message: 'All question texts must be unique within the quiz' }
                  )
                  .optional(),
            numberOfQuestionsToShow: z.number().int().min(20).max(50).optional(), // ✅ NEW
            timeLimit: z.number().min(1).max(120).optional(),
            passingPercentage: z.number().min(0).max(100).optional(), // ✅ NEW
      }),
});

export const submitQuizSchema = z.object({
      body: z.object({
            quizId: z.string().min(1, 'Quiz ID is required'),
            answers: z
                  .array(
                        z.object({
                              questionId: z.string().min(1, 'Question ID is required'),
                              selectedOption: z.string().min(1, 'Selected option is required'),
                        })
                  )
                  .min(20, 'You must answer at least 20 questions') // ✅ Changed
                  .max(50, 'You cannot answer more than 50 questions'), // ✅ Changed
            timeTaken: z.number().min(1, 'Time taken is required').max(7200), // ✅ Changed to 120 mins max
      }),
});

export const getQuizByIdSchema = z.object({
      params: z.object({
            id: z.string().min(1, 'Quiz ID is required'),
      }),
});
