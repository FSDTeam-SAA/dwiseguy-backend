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
            lessonId: {
                  type: Schema.Types.ObjectId,
                  ref: 'Instrument',
                  required: true,
            }, // TODO: Uncomment when Lesson model is ready
            classId: {
                  type: Schema.Types.ObjectId,
                  ref: 'Lesson',
                  required: true,
            }, // TODO: Uncomment when Class model is ready
            questions: {
                  type: [questionSchema],
                  required: true,
                  validate: {
                        validator: function (questions: IQuestion[]) {
                              // Only enforce 20 questions if creating a new document
                              return this.isNew ? questions.length === 20 : true;
                        },
                        message: 'Quiz must have exactly 20 questions',
                  },
            },
            timeLimit: {
                  type: Number,
                  required: true,
                  default: 20, // 20 minutes
            },
            totalMarks: {
                  type: Number,
                  required: true,
                  default: 20, // 1 mark per question
            },
            createdBy: {
                  type: Schema.Types.ObjectId,
                  ref: 'User',
                  required: true,
            },
      },
      { timestamps: true }
);

// Index for unique quiz name per class (TODO: Uncomment when classId is added)
// quizSchema.index({ quizName: 1, classId: 1 }, { unique: true });

// Validate that exactly one option is correct per question
quizSchema.pre('save', function (next) {
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

      next();
});

export const Quiz: Model<IQuiz> = mongoose.model<IQuiz>('Quiz', quizSchema);
