// import { Lesson } from "./module.model";
// // import { UserProgress } from "../progress/progress.model";
// import AppError from "../../errors/AppError";
// import { IModule } from "./module.interface";
// import { StatusCodes } from "http-status-codes";
// import mongoose from "mongoose";
// import { Course } from "../course/course.model";
// import { SubLesson } from "../sublesson/sublesson.model";

// // const createLessonIntoDb = async (payload: ILesson) => {
// //  if (payload.subLessons?.length) {
// //     const orders = payload.subLessons.map(sl => sl.order);

// //     if (new Set(orders).size !== orders.length) {
// //       throw new AppError(
// //         StatusCodes.BAD_REQUEST,
// //         "Duplicate subLesson order detected"
// //       );
// //     }
// //   }

// //   const result = await Lesson.create(payload);

// //   if (!result) {
// //     throw new AppError(
// //       StatusCodes.INTERNAL_SERVER_ERROR,
// //       "Failed to create lesson"
// //     );
// //   }

// //   return result;
// // }

// // const getSingleLessonFromDB = async (lessonId: string, userId: string) => {
// //   // 1. Fetch current lesson
// //   const currentLesson = await Lesson.findById(lessonId);
// //   if (!currentLesson) {
// //     throw new AppError(StatusCodes.NOT_FOUND, 'Lesson not found');
// //   }

// //   // 2. If it's the first lesson (order: 1), it's always unlocked
// //   if (currentLesson.order === 1) {
// //     return currentLesson;
// //   }

// //   // 3. Find the lesson immediately before this one
// //   const previousLesson = await Lesson.findOne({
// //     courseId: currentLesson.courseId,
// //     order: currentLesson.order - 1,
// //   });

// //   if (!previousLesson) {
// //     // This handles edge cases where order might have gaps
// //     return currentLesson;
// //   }

// //   // 4. Check if the student has completed the previous lesson
// //   const isCompleted = await Progress.findOne({
// //     userId,
// //     lessonId: previousLesson._id,
// //     isCompleted: true,
// //   });

// //   if (!isCompleted) {
// //     throw new AppError(
// //       StatusCodes.FORBIDDEN,
// //       `Lesson Locked! Please complete "${previousLesson.title}" and its exercises first.`
// //     );
// //   }

// //   return currentLesson;
// // };


// const createLessonIntoDb = async (payload: IModule) => {
//   const session = await mongoose.startSession();
//   try {
//     session.startTransaction();

//     // 1. Auto-calculate order
//     const lastLesson = await Lesson.findOne({ instrumentId: payload.instrumentId })
//       .sort({ order: -1 })
//       .session(session);

//     payload.order = lastLesson ? lastLesson.order + 1 : 1;
    
//     // IMPORTANT: Initialize empty array so lessons can be pushed later
//     payload.lessons = []; 

//     // 2. Create Lesson
//     const newLesson = await Lesson.create([payload], { session });

//     // 3. Link to Course
//     const updatedInstrument = await Instrument.findByIdAndUpdate(
//       payload.instrumentId,
//       { $push: { lessons: newLesson[0]._id } },
//       { session, new: true }
//     );

//     if (!updatedInstrument) throw new AppError(StatusCodes.NOT_FOUND, "Course not found");

//     await session.commitTransaction();
//     await session.endSession();
//     return newLesson[0];
//   } catch (error: any) {
//     await session.abortTransaction();
//     await session.endSession();
//     throw new AppError(StatusCodes.BAD_REQUEST, error.message);
//   }
// };


// const updateLessonInDB = async (id: string, payload: Partial<IModule>) => {
//   const isLessonExist = await Lesson.findById(id);
//   if (!isLessonExist) {
//     throw new AppError(StatusCodes.NOT_FOUND, 'Lesson not found');
//   }

//   // If the instrumentId is being changed, we need to move the reference 
//   // from the old course to the new course (Complex scenario)
//   if (payload.instrumentId && payload.courseId.toString() !== isLessonExist.courseId.toString()) {
//      const session = await mongoose.startSession();
//      try {
//        session.startTransaction();
       
//        // 1. Remove from old course
//        await Course.findByIdAndUpdate(isLessonExist.courseId, { $pull: { lessons: id } }, { session });
       
//        // 2. Add to new course
//        await Course.findByIdAndUpdate(payload.courseId, { $push: { lessons: id } }, { session });
       
//        // 3. Update Lesson
//        const result = await Lesson.findByIdAndUpdate(id, payload, { new: true, session });
       
//        await session.commitTransaction();
//        return result;
//      } catch (error) {
//        await session.abortTransaction();
//        throw error;
//      } finally {
//        session.endSession();
//      }
//   }

//   // Simple update (Title, order, etc.)
//   return await Lesson.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
// };

// const deleteLessonFromDb = async (id: string) => {
//   const lesson = await Lesson.findById(id);
//   if (!lesson) throw new AppError(StatusCodes.NOT_FOUND, "Lesson not found");

//   const session = await mongoose.startSession();
//   try {
//     session.startTransaction();

//     // 1. CHAIN SYNC: Remove from Course array
//     await Course.findByIdAndUpdate(lesson.courseId, { $pull: { lessons: id } }, { session });

//     // 2. CASCADING DELETE: Delete all Sublessons belonging to this Lesson
//     await SubLesson.deleteMany({ lessonId: id }, { session });

//     // 3. Delete Lesson document
//     const result = await Lesson.findByIdAndDelete(id, { session });

//     await session.commitTransaction();
//     return result;
//   } catch (error) {
//     await session.abortTransaction();
//     throw error;
//   } finally {
//     session.endSession();
//   }
// };

// export const lessonService = {
//     createLessonIntoDb,
//     updateLessonInDB,
//     deleteLessonFromDb
//     // getSingleLessonFromDB
// }


import { Module } from "./module.model";
import AppError from "../../errors/AppError";
import { IModule } from "./module.interface";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
// import { Instrument } from "../instrument/instrument.model"; // Renamed from Course
// import { Lesson } from "../lesson/lesson.model"; // Renamed from Sublesson

const createModuleIntoDb = async (payload: IModule) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Auto-calculate order within the specific Instrument
    const lastModule = await Module.findOne({ instrumentId: payload.instrumentId })
      .sort({ order: -1 })
      .session(session);

    payload.order = lastModule ? lastModule.order + 1 : 1;
    payload.lessons = []; 

    // 2. Create Module
    const [newModule] = await Module.create([payload], { session });

    // 3. Link to Instrument (The parent)
    const updatedInstrument = await Instrument.findByIdAndUpdate(
      payload.instrumentId,
      { $push: { modules: newModule._id } }, // Assuming Instrument has a 'modules' array
      { session, new: true }
    );

    if (!updatedInstrument) throw new AppError(StatusCodes.NOT_FOUND, "Instrument not found");

    await session.commitTransaction();
    return newModule;
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(StatusCodes.BAD_REQUEST, error.message);
  } finally {
    session.endSession();
  }
};

const updateModuleInDB = async (id: string, payload: Partial<IModule>) => {
  const isModuleExist = await Module.findById(id);
  if (!isModuleExist) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Module not found');
  }

  // Handle moving a Module to a different Instrument
  if (payload.instrumentId && payload.instrumentId.toString() !== isModuleExist.instrumentId.toString()) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      
      // 1. Remove from old Instrument
      await Instrument.findByIdAndUpdate(isModuleExist.instrumentId, { $pull: { modules: id } }, { session });
      
      // 2. Add to new Instrument
      await Instrument.findByIdAndUpdate(payload.instrumentId, { $push: { modules: id } }, { session });
      
      const result = await Module.findByIdAndUpdate(id, payload, { new: true, session });
      
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  return await Module.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};

const deleteModuleFromDb = async (id: string) => {
  const module = await Module.findById(id);
  if (!module) throw new AppError(StatusCodes.NOT_FOUND, "Module not found");

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. CHAIN SYNC: Remove from Instrument array
    await Instrument.findByIdAndUpdate(module.instrumentId, { $pull: { modules: id } }, { session });

    // 2. CASCADING DELETE: Delete all Lessons belonging to this Module
    await Lesson.deleteMany({ moduleId: id }, { session });

    // 3. Delete Module document
    const result = await Module.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const moduleService = {
  createModuleIntoDb,
  updateModuleInDB,
  deleteModuleFromDb
};