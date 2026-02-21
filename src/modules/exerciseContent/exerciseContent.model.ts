import { model, Schema } from 'mongoose';
import { IExerciseContent } from './exerciseContent.interface';
import { Lesson } from '../lesson/lesson.model';

const exerciseContentSchema = new Schema<IExerciseContent>({
      title: { type: String, required: true },
      description: { type: String, required: true },
      exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
      lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
      keyNotes: [{ type: String }],
      image: {
            url: { type: String },
            public_id: { type: String },
      },
      audio: {
            url: { type: String },
            public_id: { type: String },
      },
      isActive: { type: Boolean, default: true },
});

//pre middleware for check title is not be duplicate
exerciseContentSchema.pre('save', async function (next) {
      if (this.isModified('title')) {
            const duplicate = await ExerciseContent.findOne({ title: this.title });
            if (duplicate) {
                  return next(new Error('Title already exists'));
            }
      }
      next();
});

export const ExerciseContent = model<IExerciseContent>('ExerciseContent', exerciseContentSchema);
