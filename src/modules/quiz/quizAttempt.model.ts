import mongoose, { Schema, Model } from 'mongoose';
import { IQuizAttempt, IStudentAnswer } from './quizAttempt.interface';

// Student Answer Sub-Schema
const studentAnswerSchema = new Schema<IStudentAnswer>(
      {
            questionText: {
                  type: String,
                  required: true,
            },
            selectedOption: {
                  type: String,
                  required: true,
            },
            isCorrect: {
                  type: Boolean,
                  required: true,
            },
            correctOption: {
                  type: String,
                  required: true,
            },
      },
      { _id: false }
);

// Quiz Attempt Schema
const quizAttemptSchema = new Schema<IQuizAttempt>(
      {
            quizId: {
                  type: Schema.Types.ObjectId,
                  ref: 'Quiz',
                  required: true,
            },
            studentId: {
                  type: Schema.Types.ObjectId,
                  ref: 'User',
                  required: true,
            },
            answers: {
                  type: [studentAnswerSchema],
                  required: true,
            },
            score: {
                  type: Number,
                  required: true,
            },
            totalMarks: {
                  type: Number,
                  required: true,
                  default: 20,
            },
            percentage: {
                  type: Number,
                  required: true,
            },
            timeTaken: {
                  type: Number,
                  required: true, // in seconds
            },
            submittedAt: {
                  type: Date,
                  default: Date.now,
            },
      },
      { timestamps: true }
);

// Index to ensure one attempt per student per quiz
quizAttemptSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

export const QuizAttempt: Model<IQuizAttempt> = mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);
