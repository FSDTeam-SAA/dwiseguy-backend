import { Types } from 'mongoose';

export interface IUserProgress {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  currentLessonId: Types.ObjectId | null;
  currentSubLessonId: Types.ObjectId | null;
  completedSubLessons: Types.ObjectId[];
  completedLessons: Types.ObjectId[];
  isCourseCompleted: boolean;
}