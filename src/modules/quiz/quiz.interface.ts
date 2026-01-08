import { Document, Types } from 'mongoose';

// Single Option Interface
export interface IOption {
      optionText: string;
      isCorrect: boolean;
}

// Single Question Interface
export interface IQuestion {
      _id: string;
      questionText: string;
      options: IOption[];
}

// Main Quiz Interface
export interface IQuiz extends Document {
      _id: string;
      quizName: string;
      moduleId: Types.ObjectId;
      lessonId: Types.ObjectId;
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
      moduleId: string;
      lessonId: string;
      questions: IQuestion[];
      timeLimit?: number;
};

// Update Quiz Type
export type TUpdateQuiz = {
      quizName?: string;
      questions?: IQuestion[];
      timeLimit?: number;
};
