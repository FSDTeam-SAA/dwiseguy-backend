// import mongoose from 'mongoose';

// import { Lesson } from '../module/module.model';
// import AppError from '../../errors/AppError';
// import { StatusCodes } from 'http-status-codes';
// import { ISublesson } from './lesson.interface';
// import { SubLesson } from './lesson.model';
// import { deleteFromCloudinary } from '../../utils/cloudinary';






// const createSubLessonIntoDb = async (payload: ISublesson) => {
//   const session = await mongoose.startSession();
//   try {
//     session.startTransaction();

//     // 1. Create the Sublesson
//     // Using [payload] returns an array. Ensure the media object is preserved.
//     const [newSubLesson] = await SubLesson.create([payload], { session });

//     // 2. Push ID into Lesson's sublessons array (The Chain)
//     const updatedLesson = await Lesson.findByIdAndUpdate(
//       payload.lessonId,
//       { $push: { sublessons: newSubLesson._id } },
//       { session, new: true }
//     );

//     if (!updatedLesson) {
//       throw new AppError(StatusCodes.NOT_FOUND, "Parent Lesson not found");
//     }

//     await session.commitTransaction();
//     await session.endSession();
//     return newSubLesson;
//   } catch (error: any) {
//     await session.abortTransaction();
//     await session.endSession();
//     throw new AppError(StatusCodes.BAD_REQUEST, error.message);
//   }
// };

// const findSubLessonsByLessonId = async (lessonId: string) => {
//   const subLessons = await SubLesson.find({ lessonId });
//   return subLessons;
// };

// // const getNavigationIds = async (subLessonId: string) => {
// //   const currentSub = await subLesson.findById(subLessonId);
// //   if (!currentSub) throw new AppError(StatusCodes.NOT_FOUND, "Sublesson not found");

// //   const currentLesson = await Lesson.findById(currentSub.lessonId);
// //   if (!currentLesson) throw new AppError(StatusCodes.NOT_FOUND, "Lesson not found");

// //   // 1. FIND NEXT
// //   let nextSub = await subLesson.findOne({
// //     lessonId: currentSub.lessonId,
// //     order: { $gt: currentSub.order }
// //   }).sort({ order: 1 });

// //   if (!nextSub) {
// //     // Look in the next lesson
// //     const nextLesson = await Lesson.findOne({
// //       courseId: currentLesson.courseId,
// //       order: { $gt: currentLesson.order }
// //     }).sort({ order: 1 });

// //     if (nextLesson) {
// //       nextSub = await subLesson.findOne({ lessonId: nextLesson._id }).sort({ order: 1 });
// //     }
// //   }

// //   // 2. FIND PREVIOUS
// //   let prevSub = await subLesson.findOne({
// //     lessonId: currentSub.lessonId,
// //     order: { $lt: currentSub.order }
// //   }).sort({ order: -1 });

// //   if (!prevSub) {
// //     // Look in the previous lesson
// //     const prevLesson = await Lesson.findOne({
// //       courseId: currentLesson.courseId,
// //       order: { $lt: currentLesson.order }
// //     }).sort({ order: -1 });

// //     if (prevLesson) {
// //       prevSub = await subLesson.findOne({ lessonId: prevLesson._id }).sort({ order: -1 });
// //     }
// //   }

// //   return {
// //     previousId: prevSub?._id || null,
// //     nextId: nextSub?._id || null,
// //     currentLessonTitle: currentLesson.title
// //   };
// // };


// const updateSubLessonInDB = async (id: string, payload: any) => {
//   const isExist = await SubLesson.findById(id);
//   if (!isExist) {
//     throw new AppError(StatusCodes.NOT_FOUND, "Sublesson not found with this ID");
//   }

//   const session = await mongoose.startSession();
//   try {
//     session.startTransaction();

//     // 1. Handle Lesson ID "Chain" Sync
//     if (payload.lessonId && payload.lessonId.toString() !== isExist.lessonId.toString()) {
//       await Lesson.findByIdAndUpdate(isExist.lessonId, { $pull: { sublessons: id } }, { session });
//       await Lesson.findByIdAndUpdate(payload.lessonId, { $push: { sublessons: id } }, { session });
//     }

//     // 2. Flatten media updates to prevent overwriting the whole media object
//     // This allows updating images WITHOUT losing the existing audio
//     const { media, ...otherData } = payload;
//     const updateQuery: any = { ...otherData };

//     if (media?.images) updateQuery['media.images'] = media.images;
//     if (media?.audio) updateQuery['media.audio'] = media.audio;

//     const result = await SubLesson.findByIdAndUpdate(
//       id, 
//       { $set: updateQuery }, 
//       { new: true, session, runValidators: true }
//     );

//     await session.commitTransaction();
//     return result;
//   } catch (error) {
//     await session.abortTransaction();
//     throw error;
//   } finally {
//     session.endSession();
//   }
// };

// const deleteSubLessonFromDB = async (id: string) => {
//   const subLessonData = await SubLesson.findById(id);
//   if (!subLessonData) throw new AppError(StatusCodes.NOT_FOUND, "Sublesson not found");

//   const session = await mongoose.startSession();
//   try {
//     session.startTransaction();

//     // 1. Pull the ID out of the Parent Lesson's array
//     await Lesson.findByIdAndUpdate(
//       subLessonData.lessonId,
//       { $pull: { sublessons: id } },
//       { session }
//     );

//     // 2. MEDIA CLEANUP (Optional but recommended)
//     // Delete Audio from Cloudinary
//     if (subLessonData.media?.audio?.public_id) {
//       await deleteFromCloudinary(subLessonData.media.audio.public_id, 'audio');
//     }
//     // Delete all Images from Cloudinary
//     if (subLessonData.media?.images && subLessonData.media.images.length > 0) {
//       for (const img of subLessonData.media.images) {
//         await deleteFromCloudinary(img.public_id, 'image');
//       }
//     }

//     // 3. Delete the actual Sublesson document
//     const result = await SubLesson.findByIdAndDelete(id, { session });

//     await session.commitTransaction();
//     return result;
//   } catch (error) {
//     await session.abortTransaction();
//     throw error;
//   } finally {
//     session.endSession();
//   }
// };


// // const getSingleSubLessonFromDB = async (id: string) => {
// //   const subLesson = await Sublesson.findById(id).populate('lessonId');
// //   if (!subLesson) throw new Error('SubLesson not found');

// //   // Find Neighbors for Navigation
// //   const currentLesson = await Lesson.findById(subLesson.lessonId);
  
// //   // 1. Try to find Next SubLesson in same lesson
// //   let nextId = await Sublesson.findOne({
// //     lessonId: subLesson.lessonId,
// //     order: { $gt: subLesson.order }
// //   }).sort({ order: 1 }).select('_id');

// //   // 2. If no more sublessons, try to find the first sublesson of the NEXT lesson
// //   if (!nextId && currentLesson) {
// //     const nextLesson = await Lesson.findOne({
// //       courseId: currentLesson.courseId,
// //       order: { $gt: currentLesson.order }
// //     }).sort({ order: 1 });

// //     if (nextLesson) {
// //       nextId = await Sublesson.findOne({ lessonId: nextLesson._id })
// //         .sort({ order: 1 }).select('_id');
// //     }
// //   }

// //   // 3. Try to find Previous SubLesson
// //   let prevId = await Sublesson.findOne({
// //     lessonId: subLesson.lessonId,
// //     order: { $lt: subLesson.order }
// //   }).sort({ order: -1 }).select('_id');

// //   if (!prevId && currentLesson) {
// //     const prevLesson = await Lesson.findOne({
// //       courseId: currentLesson.courseId,
// //       order: { $lt: currentLesson.order }
// //     }).sort({ order: -1 });

// //     if (prevLesson) {
// //       prevId = await Sublesson.findOne({ lessonId: prevLesson._id })
// //         .sort({ order: -1 }).select('_id');
// //     }
// //   }

// //   return {
// //     subLesson,
// //     navigation: {
// //       nextId: nextId?._id || null,
// //       prevId: prevId?._id || null
// //     }
// //   };
// // };

// export const subLessonService = { createSubLessonIntoDb, findSubLessonsByLessonId, 
//  deleteSubLessonFromDB, updateSubLessonInDB, 
//     // getSingleSubLessonFromDB
//     };


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

export const lessonService = { 
  createLessonIntoDb, 
  findLessonsByModuleId, 
  deleteLessonFromDB, 
  updateLessonInDB 
};