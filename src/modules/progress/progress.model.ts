import { model, Schema } from 'mongoose';
import { IUserProgress } from './progress.interface';

const userProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    currentLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
    currentSubLessonId: { type: Schema.Types.ObjectId, ref: 'Sublesson', default: null },
    completedSubLessons: [{ type: Schema.Types.ObjectId, ref: 'Sublesson' }],
    completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    isCourseCompleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Prevent duplicate enrollment records
userProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const UserProgress = model<IUserProgress>('UserProgress', userProgressSchema);