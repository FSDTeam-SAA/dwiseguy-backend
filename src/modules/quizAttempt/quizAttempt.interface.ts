import { Document, Types } from 'mongoose';

// Student's answer for a single question
export interface IStudentAnswer {
      questionId: string;
      selectedOption: string;
      isCorrect: boolean;
      correctOption: string;
}

// ✅ NEW: Quiz Status Type
export type QuizStatus = 'pass' | 'retake_suggested' | 'must_retake';

// Quiz Attempt Interface
export interface IQuizAttempt extends Document {
      _id: string;
      quizId: Types.ObjectId; // Reference to Quiz
      studentId: Types.ObjectId; // Reference to User (student)
      answers: IStudentAnswer[]; // Student's answers
      score: number; // Total score obtained
      totalMarks: number; // Total marks of quiz
      percentage: number; // Percentage score
      status: QuizStatus; // ✅ NEW: pass/retake_suggested/must_retake
      timeTaken: number; // Time taken in seconds
      submittedAt: Date;
      createdAt: Date;
      updatedAt: Date;
}

// Submit Quiz Type
export type TSubmitQuiz = {
      quizId: string;
      answers: {
            questionId: string;
            selectedOption: string;
      }[];
      timeTaken: number; // in seconds
};
