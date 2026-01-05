import { model, Schema } from "mongoose";
import { IUserProgress } from "./progress.interface";

const userProgressSchema = new Schema<IUserProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  currentLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson' },
  currentSubLessonId: { type: Schema.Types.ObjectId, ref: 'SubLesson' },
  completedSubLessons: [{ type: Schema.Types.ObjectId, ref: 'SubLesson' }],
  completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
  isCourseCompleted: { type: Boolean, default: false }
}, { timestamps: true });

// Crucial for performance: prevents duplicate progress records
userProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const UserProgress = model<IUserProgress>('UserProgress', userProgressSchema);