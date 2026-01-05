import { Types } from "mongoose";

export interface ILesson {
    courseId: Types.ObjectId;
    title: string;
    slug?: string;
    content: string;
    media: {
        images: {
            url: string,
            public_id: string
        }[];
        audio: {
            url: string;
            public_id: string
        } | null;


    };
    order: number;
    isExercise: boolean;
    quizId?: Types.ObjectId;
    duration: number;
}