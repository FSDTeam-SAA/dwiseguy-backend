import { model, Schema } from 'mongoose';
import { IUserProgress } from './progress.interface';

// const userProgressSchema = new Schema<IUserProgress>(
//   {
//     userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//     instrumentId: { type: Schema.Types.ObjectId, ref: 'Instrument', required: true },
//     currentModuleId: { type: Schema.Types.ObjectId, ref: 'Module', default: null },
//     currentLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
//     completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
//     completedModules: [{ type: Schema.Types.ObjectId, ref: 'Module' }],
//     isInstrumentCompleted: { type: Boolean, default: false },
//   },
//   { timestamps: true },
// );
const userProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    instrumentId: { type: Schema.Types.ObjectId, ref: 'Instrument', required: true },
    currentModuleId: { type: Schema.Types.ObjectId, ref: 'Module', default: null },
    currentLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
    completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    completedModules: [{ type: Schema.Types.ObjectId, ref: 'Module' }],
    isInstrumentCompleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userProgressSchema.index({ userId: 1, instrumentId: 1 }, { unique: true });

export const UserProgress = model<IUserProgress>('UserProgress', userProgressSchema);