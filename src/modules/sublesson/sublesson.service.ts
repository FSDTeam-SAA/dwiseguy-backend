import mongoose from 'mongoose';

import { Lesson } from '../lesson/lesson.model';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { ISublesson } from './sublesson.interface';
import { Sublesson } from './sublesson.model';

const createSubLessonIntoDb = async (payload: ISublesson) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Create Sublesson
    const newSubLesson = await Sublesson.create([payload], { session });

    // 2. Link to Parent Lesson
    const updatedLesson = await Lesson.findByIdAndUpdate(
      payload.lessonId,
      { $push: { sublessons: newSubLesson[0]._id } },
      { session, new: true }
    );

    if (!updatedLesson) {
      throw new AppError(StatusCodes.NOT_FOUND, "Parent Lesson not found");
    }

    await session.commitTransaction();
    await session.endSession();
    return newSubLesson[0];
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(StatusCodes.BAD_REQUEST, error.message);
  }
};

const findSubLessonsByLessonId = async (lessonId: string) => {
  const subLessons = await Sublesson.find({ lessonId });
  return subLessons;
};

const getNavigationIds = async (subLessonId: string) => {
  const currentSub = await Sublesson.findById(subLessonId);
  if (!currentSub) throw new AppError(StatusCodes.NOT_FOUND, "Sublesson not found");

  const currentLesson = await Lesson.findById(currentSub.lessonId);
  if (!currentLesson) throw new AppError(StatusCodes.NOT_FOUND, "Lesson not found");

  // 1. FIND NEXT
  let nextSub = await Sublesson.findOne({
    lessonId: currentSub.lessonId,
    order: { $gt: currentSub.order }
  }).sort({ order: 1 });

  if (!nextSub) {
    // Look in the next lesson
    const nextLesson = await Lesson.findOne({
      courseId: currentLesson.courseId,
      order: { $gt: currentLesson.order }
    }).sort({ order: 1 });

    if (nextLesson) {
      nextSub = await Sublesson.findOne({ lessonId: nextLesson._id }).sort({ order: 1 });
    }
  }

  // 2. FIND PREVIOUS
  let prevSub = await Sublesson.findOne({
    lessonId: currentSub.lessonId,
    order: { $lt: currentSub.order }
  }).sort({ order: -1 });

  if (!prevSub) {
    // Look in the previous lesson
    const prevLesson = await Lesson.findOne({
      courseId: currentLesson.courseId,
      order: { $lt: currentLesson.order }
    }).sort({ order: -1 });

    if (prevLesson) {
      prevSub = await Sublesson.findOne({ lessonId: prevLesson._id }).sort({ order: -1 });
    }
  }

  return {
    previousId: prevSub?._id || null,
    nextId: nextSub?._id || null,
    currentLessonTitle: currentLesson.title
  };
};

// const getSingleSubLessonFromDB = async (id: string) => {
//   const subLesson = await Sublesson.findById(id).populate('lessonId');
//   if (!subLesson) throw new Error('SubLesson not found');

//   // Find Neighbors for Navigation
//   const currentLesson = await Lesson.findById(subLesson.lessonId);
  
//   // 1. Try to find Next SubLesson in same lesson
//   let nextId = await Sublesson.findOne({
//     lessonId: subLesson.lessonId,
//     order: { $gt: subLesson.order }
//   }).sort({ order: 1 }).select('_id');

//   // 2. If no more sublessons, try to find the first sublesson of the NEXT lesson
//   if (!nextId && currentLesson) {
//     const nextLesson = await Lesson.findOne({
//       courseId: currentLesson.courseId,
//       order: { $gt: currentLesson.order }
//     }).sort({ order: 1 });

//     if (nextLesson) {
//       nextId = await Sublesson.findOne({ lessonId: nextLesson._id })
//         .sort({ order: 1 }).select('_id');
//     }
//   }

//   // 3. Try to find Previous SubLesson
//   let prevId = await Sublesson.findOne({
//     lessonId: subLesson.lessonId,
//     order: { $lt: subLesson.order }
//   }).sort({ order: -1 }).select('_id');

//   if (!prevId && currentLesson) {
//     const prevLesson = await Lesson.findOne({
//       courseId: currentLesson.courseId,
//       order: { $lt: currentLesson.order }
//     }).sort({ order: -1 });

//     if (prevLesson) {
//       prevId = await Sublesson.findOne({ lessonId: prevLesson._id })
//         .sort({ order: -1 }).select('_id');
//     }
//   }

//   return {
//     subLesson,
//     navigation: {
//       nextId: nextId?._id || null,
//       prevId: prevId?._id || null
//     }
//   };
// };

export const subLessonService = { createSubLessonIntoDb, findSubLessonsByLessonId, getNavigationIds, 
    // getSingleSubLessonFromDB
    };