import { Types } from "mongoose";

export interface ILesson {
  courseId: Types.ObjectId; // Critical for linking to Course
//   sectionId: Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  sublessons: Types.ObjectId[]; // Array of Sublesson IDs
  createdAt?: Date;
  updatedAt?: Date;
}