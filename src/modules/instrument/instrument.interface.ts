import { Document, Model, Types, Schema } from 'mongoose';
import { ILesson } from '../lesson/lesson.interface';
import { ISublesson } from '../sublesson/sublesson.interface';

export interface Iinstrument extends Document {
      _id: string;
      instrumentTitle: string;
      instrumentDescription: string;
      instrumentImage?: string;
      modules: Types.ObjectId[]; // matches schema
      level?: 'beginner' | 'intermediate' | 'advanced';
      isActive: boolean;
      accountStatus: 'active' | 'inactive' | 'suspended';
      createdAt: Date;
      updatedAt: Date;
}

export type TCreateInstrument = {
      instrumentTitle: string;
      instrumentDescription: string;
      instrumentImage?: string;
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

export type PopulatedInstrument = Iinstrument & {
      lessons?: PopulatedLesson[];
      instrumentImage?: { public_id: string; url: string };
};
