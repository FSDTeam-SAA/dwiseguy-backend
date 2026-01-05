import { Document, Types } from 'mongoose';

// Single Option Interface
export interface IOption {
      optionText: string;
}
// Single Question Interface
export interface IQuestion {
      questionText: string;
      options: IOption[]; // exactly 4 options
      correctAnswer: string; // ✅ admin writes this
      // explanation?: string;
}

// Main Quiz Interface
export interface IQuiz extends Document {
      _id: string;
      quizName: string;
      lessonId: Types.ObjectId;
      classId: Types.ObjectId;
      questions: IQuestion[];
      timeLimit: number;
      totalMarks: number;
      createdBy: Types.ObjectId;
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
