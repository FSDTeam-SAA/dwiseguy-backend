import mongoose, { Schema, Model } from 'mongoose';
import { IQuizAttempt, IStudentAnswer } from './quizAttempt.interface';

// Student Answer Sub-Schema
const studentAnswerSchema = new Schema<IStudentAnswer>(
      {
            questionId: {
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
            },
            percentage: {
                  type: Number,
                  required: true,
            },
            status: {
                  type: String,
                  enum: ['pass', 'retake_suggested', 'must_retake'],
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

quizAttemptSchema.index({ studentId: 1, score: -1 });

quizAttemptSchema.index({ status: 1 });

export const QuizAttempt: Model<IQuizAttempt> = mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);
