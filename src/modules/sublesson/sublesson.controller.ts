import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import catchAsync from "../../utils/catchAsync";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { Request, Response } from "express";
import { subLessonService } from "./sublesson.service";
import sendResponse from "../../utils/sendResponse";

const createSubLesson = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  // DEBUG: Check this in your VS Code terminal
  console.log('Received Files:', files); 

  if (!req.body.data) throw new AppError(StatusCodes.BAD_REQUEST, "Sublesson data is required");
  const subLessonData = JSON.parse(req.body.data);

  // 1. Process Images (Must match key 'images' in Postman)
  const imageUploadPromises = (files?.images || []).map(file => 
    uploadToCloudinary(file.path, 'image')
  );
  const imageResults = await Promise.all(imageUploadPromises);
  const images = imageResults
    .filter(res => res !== null)
    .map(res => ({ url: res!.url, public_id: res!.public_id }));

  // 2. Process Audio (Must match key 'audio' in Postman)
  let audio = null;
  if (files?.audio?.[0]) {
    const audioRes = await uploadToCloudinary(files.audio[0].path, 'audio');
    if (audioRes) {
      audio = { url: audioRes.url, public_id: audioRes.public_id };
    }
  }

  // 3. Create in DB via Service
  const result = await subLessonService.createSubLessonIntoDb({
    ...subLessonData,
    media: { images, audio }
  });

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Sublesson added with media and linked to Lesson successfully',
    data: result,
  });
});


// const getSingleSubLesson = catchAsync(async (req: Request, res: Response) => {
//   const { id } = req.params;
  
//   // 1. Get the main content
//   const subLesson = await subLessonService.getSingleSubLessonFromDB(id);
  
//   // 2. Get the navigation pointers (Next/Prev)
//   const navigation = await subLessonService.getNavigationIds(id);

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "SubLesson fetched successfully",
//     data: {
//       content: subLesson,
//       navigation: navigation
//     },
//   });
// });

export const subLessonController = {
  createSubLesson,
//   getSingleSubLesson
}