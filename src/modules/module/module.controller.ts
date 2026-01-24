
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { moduleService } from './module.service'; // Renamed service
import { StatusCodes } from 'http-status-codes';
import { uploadToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';


// Admin Control
const createModule = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as any;
  
  if (!req.body.data) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Module data is required");
  }

  const moduleData = JSON.parse(req.body.data);

  let images: { url: string; public_id: string }[] = [];

  // Handle optional image uploads for the Module
  if (files?.images) {
    const imageUploadPromises = files.images.map((file: any) => 
      uploadToCloudinary(file.path, 'image')
    );
    const imageResults = await Promise.all(imageUploadPromises);
    
    images = imageResults
      .filter((res): res is { url: string; public_id: string } => res !== null)
      .map(res => ({ url: res.url, public_id: res.public_id }));
  }

  const finalPayload = {
    ...moduleData,
    images: images, 
  };

  const result = await moduleService.createModuleIntoDb(finalPayload);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Module created and linked to instrument successfully',
    data: result,
  });
});

const updateModule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await moduleService.updateModuleInDB(id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Module updated successfully',
    data: result,
  });
});

const deleteModule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await moduleService.deleteModuleFromDb(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Module and its lessons deleted successfully',
    data: null,
  });
});

// User Control
const getModulesByInstrument = catchAsync(async (req: Request, res: Response) => {
  const { instrumentId } = req.params;

  console.log("Instrument ID from Params:", instrumentId);
  const modules = await moduleService.getModulesByInstrumentFromDb(instrumentId); 

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Modules fetched successfully',
    data: modules,
  });
});

const getSingleModule = catchAsync(async (req: Request, res: Response) => {
  const { moduleId } = req.params;
  const userId = req.user?._id; // From authGuard

  const result = await moduleService.getSingleModuleWithProgressFromDb(moduleId, userId.toString());

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Module details fetched successfully",
    data: result,
  });
});

export const moduleController = {
    createModule,
    updateModule,
    deleteModule,
    getModulesByInstrument,
    getSingleModule
};