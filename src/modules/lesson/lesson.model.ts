import { ILesson } from './lesson.interface';
import { Schema, model } from 'mongoose';

const lessonSchema = new Schema<ILesson>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    media: {
      images: [{ 
        url: { type: String }, 
        public_id: { type: String } 
      }],
      // Using a Sub-document approach for cleaner Admin updates
      audio: {
        url: { type: String, default: null },
        public_id: { type: String, default: null }
      }
    },
    order: { type: Number, required: true },
    isExercise: { type: Boolean, default: false },
    duration: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Scalability Index: Optimizes fetching the curriculum in order
lessonSchema.index({ courseId: 1, order: 1 }, { unique: true });

export const Lesson = model<ILesson>('Lesson', lessonSchema);