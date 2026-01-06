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
            isActive: { type: Boolean, default: true },
      },
      { timestamps: true }
);

// pre middleware for check name is not be duplicate
courseSchema.pre('save', async function (next) {
      if (this.isModified('courseTitle')) {
            const duplicate = await Course.findOne({ courseTitle: this.courseTitle });
            if (duplicate) {
                  throw new Error('Course title already exists');
            }
      }
      next();
});



export const Course: Model<ICourse> = mongoose.model<ICourse>('Course', courseSchema);
