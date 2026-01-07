import mongoose, { Schema, Document, Model } from 'mongoose';
import { Iinstrument } from './instrument.interface';

// module Schema
const moduleSchema = new Schema<Iinstrument>(
      {
            instrumentTitle: { type: String, required: true },
            instrumentDescription: { type: String, required: true },
            instrumentImage: {
                  public_id: String,
                  url: String,
            },
            level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
            modules: [
                  {
                        type: Schema.Types.ObjectId,
                        ref: 'Module',
                  },
            ],
            isActive: { type: Boolean, default: true },
            accountStatus: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
      },
      { timestamps: true }
);

// pre middleware for check name is not be duplicate
moduleSchema.pre('save', async function (next) {
      if (this.isModified('instrumentTitle')) {
            const duplicate = await Instrument.findOne({ instrumentTitle: this.instrumentTitle });
            if (duplicate) {
                  throw new Error('Instrument title already exists');
            }
      }
      next();
});

export const Instrument: Model<Iinstrument> = mongoose.model<Iinstrument>('Instrument', moduleSchema);
