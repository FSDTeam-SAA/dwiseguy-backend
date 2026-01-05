import { ILesson } from "./lesson.interface";
import { Schema, model } from "mongoose";

const lessonSchema = new Schema<ILesson>(
  {
    courseId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Course', 
      required: true 
    },
   
    title: { type: String, required: true, trim: true },
    description: { type: String },
    order: { type: Number, required: true },
    sublessons: [
      { 
        type: Schema.Types.ObjectId, 
        ref: 'Sublesson' 
      }
    ]
  },
  { timestamps: true }
);

// Scalability: Compound index for quick section-based ordering
lessonSchema.index({ sectionId: 1, order: 1 }, { unique: true });
// Index for course-based retrieval
lessonSchema.index({ courseId: 1 });

export const Lesson = model<ILesson>("Lesson", lessonSchema);