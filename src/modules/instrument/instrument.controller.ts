import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { deleteFromCloudinary, uploadToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';
import { Instrument } from './instrument.model';
import { buildMetaPagination } from '../../utils/pagination';
import { Module } from '../module/module.model';
import { PopulatedInstrument } from './instrument.interface';
import { Lesson } from '../lesson/lesson.model';

// @desc    Create instrument
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

//get single sublessons details
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
      const instrumentId = req.params.id as string;

      // Populate modules → lessons
      const instrument = (await Instrument.findByIdAndDelete(instrumentId).populate({
            path: 'modules',
            populate: { path: 'lessons' },
      })) as PopulatedInstrument | null;
      if (!instrument) throw new AppError(404, 'Instrument not found');

      //  Loop through modules
      for (const module of instrument.modules ?? []) {
            // Delete module images
            for (const img of (module as any).images ?? []) {
                  if (img.public_id) {
                        await deleteFromCloudinary(img.public_id, 'image');
                  }
            }

            // Loop through lessons
            for (const lesson of (module as any).lessons ?? []) {
                  // Delete lesson images
                  for (const img of lesson.media?.images ?? []) {
                        if (img.public_id) {
                              await deleteFromCloudinary(img.public_id, 'image');
                        }
                  }

                  // Delete lesson audio
                  if (lesson.media?.audio?.public_id) {
                        await deleteFromCloudinary(lesson.media.audio.public_id, 'audio');
                  }
            }

            // Delete lessons from DB
            const lessonIds = (module as any).lessons?.map((lesson: any) => lesson._id) ?? [];

            if (lessonIds.length) {
                  await Lesson.deleteMany({ _id: { $in: lessonIds } });
            }
      }

      // Delete modules
      await Module.deleteMany({ instrumentId: instrument._id });

      // Delete instrument
      await instrument.deleteOne();

      sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Instrument, modules, lessons, and all media deleted successfully',
            data: instrument,
      });
});
