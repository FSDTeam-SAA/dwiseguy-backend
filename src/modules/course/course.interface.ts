import { Document, Model, Types, Schema } from 'mongoose';

export interface ICourse extends Document {
      _id: string;
      courseTitle: string;
      courseDescription: string;
      courseImage?: string;
      lessons: Types.ObjectId[]; // matches schema
      level?: 'beginner' | 'intermediate' | 'advanced';
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
}

export type TCreateCourse = {
      courseTitle: string;
      courseDescription: string;
      courseImage?: string;
      lessons?: Schema.Types.ObjectId[];
      level?: string;
};
