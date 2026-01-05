import { Schema, model } from 'mongoose';
import { ISublesson } from './sublesson.interface';

const sublessonSchema = new Schema<ISublesson>({
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  media: {
    images: [{ url: String, public_id: String }],
    audio: {
      type: { url: String, public_id: String },
      default: null
    }
  },
  isExercise: { type: Boolean, default: false },
  order: { type: Number, required: true }
}, { timestamps: true });

// Index for fast retrieval of a lesson's parts
sublessonSchema.index({ lessonId: 1, order: 1 }, { unique: true });

export const Sublesson = model<ISublesson>('Sublesson', sublessonSchema);