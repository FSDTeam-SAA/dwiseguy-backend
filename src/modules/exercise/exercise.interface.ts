import { Types } from 'mongoose';

export interface IExcerise {
      _id: Types.ObjectId;
      title: string;
      description: string;
      images: { url: string; public_id: string };
      ExerciseContent: Types.ObjectId[];
      isActive: boolean;
}
