import { Types } from "mongoose";

export interface IModule {
  instrumentId: Types.ObjectId; 
  title: string;
  description?: string;
  order: number;
  images: { url: string; public_id: string }[];
  lessons: Types.ObjectId[]; // Array of Lesson IDs (formerly Sublessons)
  createdAt?: Date;
  updatedAt?: Date;
}