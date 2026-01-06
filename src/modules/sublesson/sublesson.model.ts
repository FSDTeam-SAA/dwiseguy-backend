import { Schema, model } from 'mongoose';
import { ISublesson } from './sublesson.interface';

const sublessonSchema = new Schema<ISublesson>({
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  media: {
    images: [{ 
      url: String, 
      public_id: String 
    }],
    audio: {
      url: String,
      public_id: String
    }
  },
  isExercise: { type: Boolean, default: false },
  order: { type: Number, required: true }
}, { timestamps: true });

export const SubLesson = model<ISublesson>('Sublesson', sublessonSchema);