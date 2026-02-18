import mongoose from 'mongoose';
import { Module } from '../module/module.model';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { ILesson } from './lesson.interface';
import { Lesson } from './lesson.model';
import { deleteFromCloudinary } from '../../utils/cloudinary';

const createLessonIntoDb = async (payload: ILesson) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Create the Lesson
    const [newLesson] = await Lesson.create([payload], { session });

    // 2. Push ID into Module's lessons array (The Chain)
    const updatedModule = await Module.findByIdAndUpdate(
      payload.moduleId,
      { $push: { lessons: newLesson._id } },
      { session, new: true }
    );

    if (!updatedModule) {
      throw new AppError(StatusCodes.NOT_FOUND, "Parent Module not found");
    }

    await session.commitTransaction();
    return newLesson;
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(StatusCodes.BAD_REQUEST, error.message);
  } finally {
    session.endSession();
  }
};

const findLessonsByModuleId = async (moduleId: string) => {
  const lessons = await Lesson.find({ moduleId }).sort({ order: 1 });
  return lessons;
};

const updateLessonInDB = async (id: string, payload: any) => {
  const isExist = await Lesson.findById(id);
  if (!isExist) {
    throw new AppError(StatusCodes.NOT_FOUND, "Lesson not found with this ID");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Handle Module ID "Chain" Sync (If lesson is moved to a different module)
    if (payload.moduleId && payload.moduleId.toString() !== isExist.moduleId.toString()) {
      await Module.findByIdAndUpdate(isExist.moduleId, { $pull: { lessons: id } }, { session });
      await Module.findByIdAndUpdate(payload.moduleId, { $push: { lessons: id } }, { session });
    }

    // 2. Handle nested media updates
    const { media, ...otherData } = payload;
    const updateQuery: any = { ...otherData };

    if (media?.images) updateQuery['media.images'] = media.images;
    if (media?.audio) updateQuery['media.audio'] = media.audio;

    const result = await Lesson.findByIdAndUpdate(
      id,
      { $set: updateQuery },
      { new: true, session, runValidators: true }
    );

    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const deleteLessonFromDB = async (id: string) => {
  const lessonData = await Lesson.findById(id);
  if (!lessonData) throw new AppError(StatusCodes.NOT_FOUND, "Lesson not found");

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Pull the ID out of the Parent Module's array
    await Module.findByIdAndUpdate(
      lessonData.moduleId,
      { $pull: { lessons: id } },
      { session }
    );

    // 2. MEDIA CLEANUP
    if (lessonData.media?.audio?.public_id) {
      await deleteFromCloudinary(lessonData.media.audio.public_id, 'audio');
    }
    if (lessonData.media?.images && lessonData.media.images.length > 0) {
      for (const img of lessonData.media.images) {
        await deleteFromCloudinary(img.public_id, 'image');
      }
    }

    // 3. Delete the actual Lesson document
    const result = await Lesson.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// User Control

const getLessonByModuleIdFromDb = async (moduleId: string) => {
  const lessons = await findLessonsByModuleId(moduleId);
  return lessons;
}



const getSingleLessonFromDb = async (lessonId: string) => {
  const result = await Lesson.findById(lessonId);
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Lesson not found');
  }
  return result;
};

export const lessonService = {
  createLessonIntoDb,
  findLessonsByModuleId,
  deleteLessonFromDB,
  updateLessonInDB,
  getLessonByModuleIdFromDb,
  getSingleLessonFromDb
};