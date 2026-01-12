import { Document, Types } from 'mongoose';

// Single Option Interface
export interface IOption {
      optionText: string;
      isCorrect: boolean;
}

// Single Question Interface
export interface IQuestion {
      _id?: string;
      questionText: string;
      options: IOption[];
}

// Main Quiz Interface
export interface IQuiz extends Document {
      _id: string;
      quizName: string;
      moduleId: Types.ObjectId; // ✅ Using moduleId instead of lessonId
      // lessonId: Types.ObjectId; // TODO: Uncomment when Lesson model is ready
      questions: IQuestion[];
      numberOfQuestionsToShow: number; // ✅ NEW: How many questions to show
      timeLimit: number;
      totalMarks: number;
      passingPercentage: number; // ✅ NEW: Passing percentage
      createdBy: Types.ObjectId;
      createdAt: Date;
      updatedAt: Date;
}

// Create Quiz Type
export type TCreateQuiz = {
      quizName: string;
      moduleId: string; // ✅ Using moduleId
      // lessonId: string; // TODO: Uncomment when Lesson model is ready
      questions: IQuestion[];
      numberOfQuestionsToShow: number; // ✅ NEW
      timeLimit?: number;
      passingPercentage?: number; // ✅ NEW
};

// Update Quiz Type
export type TUpdateQuiz = {
      quizName?: string;
      moduleId?: string;
      // lessonId?: string;
      questions?: IQuestion[];
      numberOfQuestionsToShow?: number; // ✅ NEW
      timeLimit?: number;
      passingPercentage?: number; // ✅ NEW
};
