import mongoose, { Schema, Document, Model } from 'mongoose';
import { ICourse } from '../course/course.interface';

// Course Schema
const courseSchema = new Schema<ICourse>(
      {
            courseTitle: { type: String, required: true },
            courseDescription: { type: String, required: true },
            courseImage: {
                  public_id: String,
                  url: String,
            },
            level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
            lessons: [
                  {
                        type: Schema.Types.ObjectId,
                        ref: 'Lesson',
                  },
            ],
      },
      { timestamps: true }
);

export const Course: Model<ICourse> = mongoose.model<ICourse>('Course', courseSchema);
