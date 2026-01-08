import { Types } from 'mongoose';

export interface IQuizRecord {
  quizId: Types.ObjectId;
  lessonId: Types.ObjectId;
  score: number;
  isPassed: boolean;
}

export interface IUserProgress {
  userId: Types.ObjectId;
  instrumentId: Types.ObjectId; // Formerly courseId
  currentModuleId: Types.ObjectId | null; // Formerly currentLessonId
  currentLessonId: Types.ObjectId | null; // Formerly currentSubLessonId
  completedLessons: Types.ObjectId[]; // Formerly completedSubLessons
  completedModules: Types.ObjectId[]; // Formerly completedLessons
  isInstrumentCompleted: boolean; // Formerly isCourseCompleted
  quizAttempts: IQuizRecord[];
}