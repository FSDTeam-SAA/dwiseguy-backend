


import { Schema, model } from 'mongoose';
import { ILesson } from './lesson.interface';

const lessonSchema = new Schema<ILesson>({
  moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
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
  order: { type: Number, required: true },
  // comment from Mohsin: This field should added on module.model.ts | I will add there. 
quizIds: [
  {
    type: Schema.Types.ObjectId,
    ref: "Quiz"
  }
]

}, { timestamps: true });

export const Lesson = model<ILesson>('Lesson', lessonSchema);