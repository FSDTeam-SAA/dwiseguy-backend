import mongoose, { Schema, Model } from 'mongoose';
import { IQuiz, IQuestion, IOption } from './quiz.interface';

// Option Sub-Schema
const optionSchema = new Schema<IOption>(
      {
            optionText: {
                  type: String,
                  required: true,
            },
            isCorrect: {
                  type: Boolean,
                  required: true,
                  default: false,
            },
      },
      { _id: false }
);

// Question Sub-Schema
const questionSchema = new Schema<IQuestion>(
      {
            questionText: {
                  type: String,
                  required: true,
                  trim: true,
            },
            options: {
                  type: [optionSchema],
                  required: true,
                  validate: {
                        validator: function (options: IOption[]) {
                              return options.length === 4;
                        },
                        message: 'Each question must have exactly 4 options',
                  },
            },
            // explanation: { type: String }, // TODO: Add later if needed
      },
      { _id: true }
);

// Main Quiz Schema
const quizSchema = new Schema<IQuiz>(
      {
            quizName: {
                  type: String,
                  required: true,
                  trim: true,
            },
            instrumentId: {
                  type: Schema.Types.ObjectId,
                  ref: 'Instrument',
                  required: true,
            },
            moduleId: {
                  type: Schema.Types.ObjectId,
                  ref: 'Module',
                  required: true,
            },
            // lessonId: {
            //       type: Schema.Types.ObjectId,
            //       ref: 'Lesson',
            //       required: true,
            // },
            questions: {
                  type: [questionSchema],
                  required: true,
                  validate: {
                        validator: function (questions: IQuestion[]) {
                              // ✅ Updated: Allow 20-50 questions
                              return questions.length >= 20 && questions.length <= 50;
                        },
                        message: 'Quiz must have between 20 and 50 questions',
                  },
            },
            numberOfQuestionsToShow: {
                  // ✅ NEW: How many questions student will see
                  type: Number,
                  required: true,
                  min: 20,
                  max: 50,
                  default: 20,
            },
            timeLimit: {
                  type: Number,
                  required: true,
                  default: 20,
            },
            totalMarks: {
                  type: Number,
                  required: true,
                  default: 20, // Will be set to numberOfQuestionsToShow
            },
            passingPercentage: {
                  // ✅ NEW: Passing percentage (default 75%)
                  type: Number,
                  required: true,
                  default: 75,
                  min: 0,
                  max: 100,
            },
            createdBy: {
                  type: Schema.Types.ObjectId,
                  ref: 'User',
                  required: true,
            },
      },
      { timestamps: true }
);

quizSchema.index({ quizName: 1, moduleId: 1 }, { unique: true });

// Validate constraints
quizSchema.pre('save', function (next) {
      // ✅ NEW: Validate numberOfQuestionsToShow <= total questions
      if (this.numberOfQuestionsToShow > this.questions.length) {
            return next(
                  new Error(
                        `numberOfQuestionsToShow (${this.numberOfQuestionsToShow}) cannot be greater than total questions (${this.questions.length})`
                  )
            );
      }

      // Validate that exactly one option is correct per question
      for (const question of this.questions) {
            const correctCount = question.options.filter((opt) => opt.isCorrect).length;
            if (correctCount !== 1) {
                  return next(
                        new Error(
                              `Each question must have exactly 1 correct option. Question: "${question.questionText}"`
                        )
                  );
            }

            // Validate unique options
            const optionTexts = question.options.map((opt) => opt.optionText.toLowerCase().trim());
            const uniqueOptions = new Set(optionTexts);
            if (uniqueOptions.size !== optionTexts.length) {
                  return next(new Error(`All options must be unique for question: "${question.questionText}"`));
            }
      }

      // Validate unique question texts
      const questionTexts = this.questions.map((q) => q.questionText.toLowerCase().trim());
      const uniqueQuestions = new Set(questionTexts);
      if (uniqueQuestions.size !== questionTexts.length) {
            return next(new Error('All question texts must be unique within the quiz'));
      }

      // ✅ NEW: Set totalMarks = numberOfQuestionsToShow (1 mark per question)
      this.totalMarks = this.numberOfQuestionsToShow;
      this.timeLimit = this.numberOfQuestionsToShow;

      next();
});

export const Quiz: Model<IQuiz> = mongoose.model<IQuiz>('Quiz', quizSchema);
