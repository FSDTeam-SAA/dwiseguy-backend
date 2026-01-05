import { Lesson } from "./lesson.model";
// import { Progress } from "../progress/progress.model";
import AppError from "../../errors/AppError";
import { ILesson } from "./lesson.interface";
import { StatusCodes } from "http-status-codes";

const createLessonIntoDb = async (payload: ILesson) => {
    const result = await Lesson.create(payload);
    if (!result) {
        throw new AppError(400, "Failed to create lesson");
    }
    return result;
}

// const getSingleLessonFromDB = async (lessonId: string, userId: string) => {
//   // 1. Fetch current lesson
//   const currentLesson = await Lesson.findById(lessonId);
//   if (!currentLesson) {
//     throw new AppError(StatusCodes.NOT_FOUND, 'Lesson not found');
//   }

//   // 2. If it's the first lesson (order: 1), it's always unlocked
//   if (currentLesson.order === 1) {
//     return currentLesson;
//   }

//   // 3. Find the lesson immediately before this one
//   const previousLesson = await Lesson.findOne({
//     courseId: currentLesson.courseId,
//     order: currentLesson.order - 1,
//   });

//   if (!previousLesson) {
//     // This handles edge cases where order might have gaps
//     return currentLesson;
//   }

//   // 4. Check if the student has completed the previous lesson
//   const isCompleted = await Progress.findOne({
//     userId,
//     lessonId: previousLesson._id,
//     isCompleted: true,
//   });

//   if (!isCompleted) {
//     throw new AppError(
//       StatusCodes.FORBIDDEN,
//       `Lesson Locked! Please complete "${previousLesson.title}" and its exercises first.`
//     );
//   }

//   return currentLesson;
// };

export const lessonService = {
    createLessonIntoDb,
    // getSingleLessonFromDB
}