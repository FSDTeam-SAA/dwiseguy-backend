import { Types } from "mongoose";

export interface ILesson {
  courseId: Types.ObjectId; // Critical for linking to Course
  title: string;
  description?: string;
  order: number;
  images: { url: string; public_id: string }[];
  sublessons: Types.ObjectId[]; // Array of Sublesson IDs
  createdAt?: Date;
  updatedAt?: Date;
}