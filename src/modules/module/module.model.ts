import { IModule } from './module.interface';
import { Schema, model } from 'mongoose';

const ModuleSchema = new Schema<IModule>(
      {
            instrumentId: {
                  type: Schema.Types.ObjectId,
                  ref: 'Instrument',
                  required: true,
            },
            title: { type: String, required: true, trim: true },
            description: { type: String },
            order: { type: Number, required: true },
            images: [
                  {
                        url: { type: String, required: true },
                        public_id: { type: String, required: true },
                  },
            ],
            lessons: [
                  {
                        type: Schema.Types.ObjectId,
                        ref: 'Lesson', // Points to the child (formerly Sublesson)
                  },
            ],
            // comment from Mohsin: I add this field. I think it should be a single element. but there is an array of objects. but it always has only one element
            quizIds: [
                  {
                        type: Schema.Types.ObjectId,
                        ref: 'Quiz',
                  },
            ],
      },
      { timestamps: true }
);

// Indexes updated for new naming
ModuleSchema.index({ instrumentId: 1, order: 1 }, { unique: true });

export const Module = model<IModule>('Module', ModuleSchema);
