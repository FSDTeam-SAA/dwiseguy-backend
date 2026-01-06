import { Document, Types } from 'mongoose';

// Single Option Interface
export interface IOption {
      optionText: string;
      isCorrect: boolean;
}

// Single Question Interface
export interface IQuestion {
      questionText: string;
      options: IOption[]; // 4 options, one correct
      // explanation?: string; // Optional: explain why answer is correct
}

// Main Quiz Interface
export interface IQuiz extends Document {
      _id: string;
      quizName: string; // Unique per class/lesson
      lessonId: Types.ObjectId; // TODO: Uncomment when Lesson model is ready - Reference to Lesson
      classId: Types.ObjectId; // TODO: Uncomment when Class model is ready - Reference to Class
      questions: IQuestion[]; // Array of 20 questions
      timeLimit: number; // Time limit in minutes (default 20)
      totalMarks: number; // Total marks (default 20, 1 mark per question)
      createdBy: Types.ObjectId; // Admin who created the quiz
      createdAt: Date;
      updatedAt: Date;
}

// Create Quiz Type
export type TCreateQuiz = {
      quizName: string;
      lessonId: string; // TODO: Uncomment when Lesson model is ready
      classId: string; // TODO: Uncomment when Class model is ready
      questions: IQuestion[];
      timeLimit?: number;
};

// Update Quiz Type
export type TUpdateQuiz = {
      quizName?: string;
      questions?: IQuestion[];
      timeLimit?: number;
};
