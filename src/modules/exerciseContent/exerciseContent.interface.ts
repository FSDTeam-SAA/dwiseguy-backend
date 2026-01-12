import { Types } from 'mongoose';

export interface IExerciseContent {
      _id: Types.ObjectId;
      title: string;
      description: string;
      exerciseId: Types.ObjectId;
      keyNotes: string[];
      image: { url: string; public_id: string } | null;
      audio: { url: string; public_id: string } | null;
      isActive: boolean;
}
