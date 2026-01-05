import { Lesson } from "./lesson.model";
// import { Progress } from "../progress/progress.model";
import AppError from "../../errors/AppError";
import { ILesson } from "./lesson.interface";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { Course } from "../course/course.model";

// const createLessonIntoDb = async (payload: ILesson) => {
//  if (payload.subLessons?.length) {
//     const orders = payload.subLessons.map(sl => sl.order);

//     if (new Set(orders).size !== orders.length) {
//       throw new AppError(
//         StatusCodes.BAD_REQUEST,
//         "Duplicate subLesson order detected"
//       );
//     }
//   }

//   const result = await Lesson.create(payload);

//   if (!result) {
//     throw new AppError(
//       StatusCodes.INTERNAL_SERVER_ERROR,
//       "Failed to create lesson"
//     );
//   }

//   return result;
// }

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


const createLessonIntoDb = async (payload: ILesson) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Create Lesson
    const newLesson = await Lesson.create([payload], { session });

    // 2. Link to Course
    const updatedCourse = await Course.findByIdAndUpdate(
      payload.courseId,
      { $push: { lessons: newLesson[0]._id } },
      { session, new: true }
    );

    if (!updatedCourse) throw new AppError(StatusCodes.NOT_FOUND, "Course not found");

    await session.commitTransaction();
    await session.endSession();
    return newLesson[0];
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(StatusCodes.BAD_REQUEST, error.message);
  }
};

export const lessonService = {
    createLessonIntoDb,
    // getSingleLessonFromDB
}