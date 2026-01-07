import { Types } from 'mongoose';

export interface IUserProgress {
  userId: Types.ObjectId;
  instrumentId: Types.ObjectId; // Formerly courseId
  currentModuleId: Types.ObjectId | null; // Formerly currentLessonId
  currentLessonId: Types.ObjectId | null; // Formerly currentSubLessonId
  completedLessons: Types.ObjectId[]; // Formerly completedSubLessons
  completedModules: Types.ObjectId[]; // Formerly completedLessons
  isInstrumentCompleted: boolean; // Formerly isCourseCompleted
}