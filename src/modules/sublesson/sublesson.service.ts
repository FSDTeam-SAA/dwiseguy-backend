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

export const subLessonService = { createSubLessonIntoDb, findSubLessonsByLessonId };