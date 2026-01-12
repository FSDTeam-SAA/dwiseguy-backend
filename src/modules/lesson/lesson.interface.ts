
import { Types } from 'mongoose';

export interface ILesson {
  moduleId: Types.ObjectId; // Parent Module (formerly lessonId)
  title: string;
  content: string;
  media: {
    images: { url: string; public_id: string }[];
    audio: { url: string; public_id: string } | null;
  };
  isExercise: boolean; // Virtual Piano trigger
  order: number;
  exerciseIds: Types.ObjectId[];
}