import { Document, Model, Types, Schema } from 'mongoose';
import { ILesson } from '../lesson/lesson.interface';
import { IModule } from '../module/module.interface';

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

export type PopulatedModule = IModule & {
      media?: {
            images?: { public_id: string; url: string }[];
            audio?: { public_id: string; url: string };
      };
};

export type PopulatedLesson = ILesson & {
      images?: { public_id: string; url: string }[];
      sublessons?: PopulatedModule[];
};

export type PopulatedInstrument = Iinstrument & {
      lessons?: PopulatedLesson[];
      instrumentImage?: { public_id: string; url: string };
};
