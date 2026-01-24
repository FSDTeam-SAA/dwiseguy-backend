import { Types } from 'mongoose';

export interface IModule {
      instrumentId: Types.ObjectId;
      title: string;
      description?: string;
      order: number;
      images: { url: string; public_id: string }[];
      lessons: Types.ObjectId[]; // Array of Lesson IDs (formerly Sublessons)
      quizIds: Types.ObjectId[]; //Message from Mohsin. I add this field as client requirement.

      createdAt?: Date;
      updatedAt?: Date;
}
