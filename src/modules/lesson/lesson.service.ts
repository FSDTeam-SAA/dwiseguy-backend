import { Lesson } from './lesson.model';
// import { UserProgress } from "../progress/progress.model";
import AppError from '../../errors/AppError';
import { ILesson } from './lesson.interface';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { Course } from '../instrument/instrument.model';
import { SubLesson } from '../sublesson/sublesson.model';

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

const createLessonIntoDb = async (payload: ILesson) => {
      const session = await mongoose.startSession();
      try {
            session.startTransaction();

            // 1. Auto-calculate order
            const lastLesson = await Lesson.findOne({ courseId: payload.courseId })
                  .sort({ order: -1 })
                  .session(session);

            payload.order = lastLesson ? lastLesson.order + 1 : 1;

            // IMPORTANT: Initialize empty array so Sublessons can be pushed later
            payload.sublessons = [];

            // 2. Create Lesson
            const newLesson = await Lesson.create([payload], { session });

            // 3. Link to Course
            const updatedCourse = await Course.findByIdAndUpdate(
                  payload.courseId,
                  { $push: { lessons: newLesson[0]._id } },
                  { session, new: true }
            );

            if (!updatedCourse) throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');

            await session.commitTransaction();
            await session.endSession();
            return newLesson[0];
      } catch (error: any) {
            await session.abortTransaction();
            await session.endSession();
            throw new AppError(StatusCodes.BAD_REQUEST, error.message);
      }
};

const updateLessonInDB = async (id: string, payload: Partial<ILesson>) => {
      const isLessonExist = await Lesson.findById(id);
      if (!isLessonExist) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Lesson not found');
      }

      // If the courseId is being changed, we need to move the reference
      // from the old course to the new course (Complex scenario)
      if (payload.courseId && payload.courseId.toString() !== isLessonExist.courseId.toString()) {
            const session = await mongoose.startSession();
            try {
                  session.startTransaction();

                  // 1. Remove from old course
                  await Course.findByIdAndUpdate(isLessonExist.courseId, { $pull: { lessons: id } }, { session });

                  // 2. Add to new course
                  await Course.findByIdAndUpdate(payload.courseId, { $push: { lessons: id } }, { session });

                  // 3. Update Lesson
                  const result = await Lesson.findByIdAndUpdate(id, payload, { new: true, session });

                  await session.commitTransaction();
                  return result;
            } catch (error) {
                  await session.abortTransaction();
                  throw error;
            } finally {
                  session.endSession();
            }
      }

      // Simple update (Title, order, etc.)
      return await Lesson.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};

const deleteLessonFromDb = async (id: string) => {
      const lesson = await Lesson.findById(id);
      if (!lesson) throw new AppError(StatusCodes.NOT_FOUND, 'Lesson not found');

      const session = await mongoose.startSession();
      try {
            session.startTransaction();

            // 1. CHAIN SYNC: Remove from Course array
            await Course.findByIdAndUpdate(lesson.courseId, { $pull: { lessons: id } }, { session });

            // 2. CASCADING DELETE: Delete all Sublessons belonging to this Lesson
            await SubLesson.deleteMany({ lessonId: id }, { session });

            // 3. Delete Lesson document
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
      updateLessonInDB,
      deleteLessonFromDb,
      // getSingleLessonFromDB
};
