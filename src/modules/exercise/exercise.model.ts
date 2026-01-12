import { model, Schema } from 'mongoose';
import { IExcerise } from './exercise.interface';


const exerciseSchema = new Schema<IExcerise>({
      title: {
            type: String,
            required: [true, 'Title is required'],
            // enum: {
            //       values: ['Pitch', 'C-clef', 'Piano', 'Recap', 'Treble clef', 'Bass clef'],
            //       message: 'Invalid title. Allowed values are: Pitch, C-clef, Piano, Recap, Treble clef, Bass clef',
            // },
      },
      description: { type: String, required: true },
      images: {
            url: { type: String },
            public_id: { type: String },
      },
      ExerciseContent: [{ type: Schema.Types.ObjectId, ref: 'ExerciseContent' }],
      isActive: { type: Boolean, default: true },
});

//pre middleware for check title is not be duplicate
exerciseSchema.pre('save', async function (next) {
      if (this.isModified('title')) {
            const duplicate = await Excerise.findOne({ title: this.title });
            if (duplicate) {
                  return next(new Error('Title already exists'));
            }
      }
      next();
});
//ptr middleware for check title is not be duplicate when update
exerciseSchema.pre('findOneAndUpdate', async function (next) {
      const update = this.getUpdate() as any;
      if (update && update .title ) {
            const duplicate = await Excerise.findOne({ title: update.title });
            if (duplicate) {
                  return next(new Error('Title already exists'));
            }
      }
      next();
})
export const Excerise = model<IExcerise>('Exercise', exerciseSchema);
