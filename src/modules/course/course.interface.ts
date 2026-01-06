import { Document, Model, Types, Schema } from 'mongoose';
import { ILesson } from '../lesson/lesson.interface';
import { ISublesson } from '../sublesson/sublesson.interface';

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


export type PopulatedSubLesson = ISublesson & {
      media?: {
            images?: { public_id: string; url: string }[];
            audio?: { public_id: string; url: string };
      };
};

export type PopulatedLesson = ILesson & {
      images?: { public_id: string; url: string }[];
      sublessons?: PopulatedSubLesson[];
};

export type PopulatedCourse = ICourse & {
      lessons?: PopulatedLesson[];
      courseImage?: { public_id: string; url: string };
};
