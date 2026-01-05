import { Schema, model, Document, Types } from 'mongoose';

export interface IUserProgress extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  completedSubLessons: Types.ObjectId[];
  completedLessons: Types.ObjectId[];
  currentLessonId: Types.ObjectId;
  currentSubLessonId: Types.ObjectId;
  isCourseCompleted: boolean;
}