import { Module } from "./module.model";
import AppError from "../../errors/AppError";
import { IModule } from "./module.interface";
import { StatusCodes } from "http-status-codes";
import mongoose, { Types } from "mongoose";
import { Instrument } from "../instrument/instrument.model";
import { Lesson } from "../lesson/lesson.model";
import { UserProgress } from "../progress/progress.model";
import { lessonService } from '../lesson/lesson.service';

// Admin Control
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

// User Control

const getModulesByInstrumentFromDb = async(instrumentId: string) => {
  const modules = await Module.find({ 
    instrumentId: new Types.ObjectId(instrumentId) 
  }).sort({ order: 1 });

  return modules;
}


const getSingleModuleWithProgressFromDb = async (moduleId: string, userId: string) => {
  const module = await Module.findById(moduleId).populate({
    path: 'lessons',
    options: { sort: { order: 1 } }
  });

  if (!module) throw new AppError(StatusCodes.NOT_FOUND, "Module not found");

  // Fetch the user's progress for this instrument
  const progress = await UserProgress.findOne({ 
    userId, 
    instrumentId: module.instrumentId 
  });

  // If no progress exists, only the first lesson of the first module is unlocked
  // Otherwise, we check the completedLessons array
  const formattedLessons = module.lessons.map((lesson: any) => {
    const isCompleted = progress?.completedLessons.includes(lesson._id);
    
    // Logic: Unlocked if it's completed OR it's the current lesson they are on
    const isUnlocked = isCompleted || 
                       progress?.currentLessonId?.toString() === lesson._id.toString() ||
                       (lesson.order === 1 && module.order === 1); 

    return {
      ...lesson.toObject(),
      isCompleted: !!isCompleted,
      isUnlocked: !!isUnlocked
    };
  });

  return {
    ...module.toObject(),
    lessons: formattedLessons
  };
};


export const moduleService = {
  createModuleIntoDb,
  updateModuleInDB,
  deleteModuleFromDb,

  getModulesByInstrumentFromDb,
  getSingleModuleWithProgressFromDb
};