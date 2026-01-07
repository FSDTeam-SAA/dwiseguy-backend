import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { deleteFromCloudinary, uploadToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';
import { Instrument } from './instrument.model';
import { buildMetaPagination } from '../../utils/pagination';
import { Lesson } from '../lesson/lesson.model';
import { SubLesson } from '../sublesson/sublesson.model';
import { PopulatedInstrument } from './instrument.interface';

// @desc    Create user
export const createInstrument = catchAsync(async (req: Request, res: Response) => {
      const value = req.body;

      const instrument = await Instrument.create(value);
      if (!instrument as any) throw new AppError(400, 'User registration failed');

      const image = req.file;

      if (image) {
            const result = await uploadToCloudinary(image.path, 'image');
            if (result) {
                  (instrument as any).instrumentImage = {
                        public_id: result.public_id,
                        url: result.url,
                  };
                  await instrument.save();
            }
      }
      await instrument.save();

      sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'Instrument created successfully',
            data: instrument,
      });
});

//get single course details
export const getSingleInstrument = catchAsync(async (req: Request, res: Response) => {
      const id = req.params.id as string;
      const instrument = await Instrument.findById(id);
      if (!instrument) throw new AppError(404, 'Instrument not found');
      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Instrument fetched successfully',
            data: instrument,
      });
});

//get all courses
export const getAllInstruments = catchAsync(async (req: Request, res: Response) => {
      //  Read query params
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.max(Number(req.query.limit) || 10, 1);

      const skip = (page - 1) * limit;

      //  Fetch data
      const [instruments, totalItems] = await Promise.all([
            Instrument.find().skip(skip).limit(limit),
            Instrument.countDocuments(),
      ]);

      //  Build pagination meta
      const meta = buildMetaPagination(totalItems, page, limit);

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Instruments fetched successfully',
            data: {
                  meta,
                  instruments,
            },
      });
});

//update course
export const updateInstrument = catchAsync(async (req: Request, res: Response) => {
      const id = req.params.id as string;
      const value = req.body;
      const image = req.file as Express.Multer.File;

      const instrument = await Instrument.findByIdAndUpdate(id, value, { new: true });
      if (image) {
            console.log((instrument as any).instrumentImage);

            if (
                  instrument?.instrumentImage &&
                  typeof instrument.instrumentImage === 'object' &&
                  'public_id' in instrument.instrumentImage
            ) {
                  //delete previous image from cloudinary
                  await deleteFromCloudinary((instrument.instrumentImage as any).public_id as string, 'image');
            }
            const result = await uploadToCloudinary(image.path, 'image');
            if (result) {
                  value.instrumentImage = {
                        public_id: result.public_id,
                        url: result.url,
                  };
            }
      }

      if (!instrument) throw new AppError(404, 'Instrument not found');
      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Instrument updated successfully',
            data: instrument,
      });
});

//delete course
export const deleteInstrument = catchAsync(async (req: Request, res: Response) => {
      const InstrumentId = req.params.id as string;

      // Populate lessons and sublessons
      const instrument = (await Instrument.findById(InstrumentId).populate({
            path: 'lessons',
            populate: { path: 'sublessons' },
      })) as PopulatedInstrument | null;

      if (!instrument) throw new AppError(404, 'Instrument not found');

      // Delete course image
      if (instrument.instrumentImage?.public_id) {
            await deleteFromCloudinary(instrument.instrumentImage.public_id, 'image');
      }

      // Loop through lessons
      for (const lesson of instrument.lessons ?? []) {
            // Delete lesson images
            for (const img of lesson.images ?? []) {
                  if (img.public_id) await deleteFromCloudinary(img.public_id, 'image');
            }

            // Delete sublesson media
            for (const sub of lesson.sublessons ?? []) {
                  // Images
                  for (const img of sub.media?.images ?? []) {
                        if (img.public_id) await deleteFromCloudinary(img.public_id, 'image');
                  }

                  // Audio
                  if (sub.media?.audio?.public_id) {
                        await deleteFromCloudinary(sub.media.audio.public_id, 'audio');
                  }
            }

            // Delete sublessons from DB
            const sublessonIds = lesson.sublessons?.map((s) => s._id) ?? [];
            if (sublessonIds.length) {
                  await SubLesson.deleteMany({ _id: { $in: sublessonIds } });
            }
      }

      // Delete all lessons of the course
      await Lesson.deleteMany({ courseId: instrument._id });

      // Delete the course itself
      await instrument.deleteOne();

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Instrument, lessons, sublessons, and all media deleted successfully',
            data: instrument,
      });
});
