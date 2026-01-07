// import { Types } from 'mongoose';

// export interface ISublesson {
//   lessonId: Types.ObjectId; // Parent Lesson
//   title: string;
//   content: string;
//   media: {
//     images: { url: string; public_id: string }[];
//     audio: { url: string; public_id: string } | null;
//   };
//   isExercise: boolean; // Virtual Piano trigger
//   order: number;
// }

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
}