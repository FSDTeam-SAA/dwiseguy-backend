import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { Instrument } from '../instrument/instrument.model';
import { Module } from '../module/module.model';
import { Lesson } from '../lesson/lesson.model';
import { UserProgress } from './progress.model';
import { Types } from 'mongoose';


const initializeProgress = async (userId: string, instrumentId: string) => {
    const instObjId = new Types.ObjectId(instrumentId);
    const userObjId = new Types.ObjectId(userId);

    const instrumentExists = await Instrument.findById(instObjId);
    if (!instrumentExists) throw new AppError(StatusCodes.NOT_FOUND, "Instrument not found.");

    const firstModule = await Module.findOne({ instrumentId: instObjId }).sort({ order: 1 });
    if (!firstModule) throw new AppError(StatusCodes.BAD_REQUEST, "This instrument has no modules yet.");

    const existingProgress = await UserProgress.findOne({ userId: userObjId, instrumentId: instObjId });
    if (existingProgress) return existingProgress;

    const firstLesson = await Lesson.findOne({ moduleId: firstModule._id }).sort({ order: 1 });

    return await UserProgress.create({
        userId: userObjId,
        instrumentId: instObjId,
        currentModuleId: firstModule._id,
        currentLessonId: firstLesson ? firstLesson._id : null,
    });
};

const getInstrumentDetailsWithProgress = async (userId: string, instrumentId: string) => {
    const instrument = await Instrument.findById(instrumentId).populate({
        path: 'modules',
        options: { sort: { order: 1 } },
        populate: { path: 'lessons', options: { sort: { order: 1 } } }
    });

    if (!instrument) throw new AppError(StatusCodes.NOT_FOUND, "Instrument not found");

    const progress = await UserProgress.findOne({ userId, instrumentId });

    // Flatten all lessons across all modules for progress bar
    const allLessons = instrument.modules.reduce((acc: any[], mod: any) => {
        return [...acc, ...mod.lessons];
    }, []);

    const totalLessons = allLessons.length;
    const completedCount = progress?.completedLessons?.length || 0;
    const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    const moduleData = instrument.modules.map((mod: any, index: number) => {
        const isCompleted = progress?.completedModules.some(id => id.equals(mod._id));
        const isCurrent = progress?.currentModuleId?.equals(mod._id);
        const previousModule = index > 0 ? instrument.modules[index - 1] : null;
        const isPreviousCompleted = previousModule 
            ? progress?.completedModules.some(id => id.equals(previousModule._id)) 
            : false;

            const isUnlocked = index === 0 || isCompleted || isCurrent || isPreviousCompleted;

        return {
            _id: mod._id,
            title: mod.title,
            order: mod.order,
            isUnlocked,
            isCompleted: isCompleted || false,
            lessons: mod.lessons.map((less: any) => ({
                _id: less._id,
                title: less.title,
                isCompleted: progress?.completedLessons.some(id => id.equals(less._id)),
                isLocked: !isUnlocked
            }))
        };
    });

    return {
        instrumentTitle: instrument.instrumentTitle,
        stats: { totalLessons, completedLessons: completedCount, completionPercentage },
        isInstrumentCompleted: progress?.isInstrumentCompleted || false,
        modules: moduleData
    };
};

const updateStudentProgress = async (userId: string, lessonId: string) => {
    const currentLesson = await Lesson.findById(lessonId);
    if (!currentLesson) throw new AppError(StatusCodes.NOT_FOUND, "Lesson not found");

    const currentModule = await Module.findById(currentLesson.moduleId);
    if (!currentModule) throw new AppError(StatusCodes.NOT_FOUND, "Parent Module not found");

    const instrumentId = currentModule.instrumentId;

    const progress = await UserProgress.findOne({ userId, instrumentId });
    if (!progress) throw new AppError(StatusCodes.NOT_FOUND, "Not enrolled in this instrument");

    // Mark Lesson as finished
    await UserProgress.updateOne(
        { _id: progress._id },
        { $addToSet: { completedLessons: new Types.ObjectId(lessonId) } }
    );

    // Check for Next Lesson in same Module
    const nextLesson = await Lesson.findOne({
        moduleId: currentModule._id,
        order: { $gt: currentLesson.order }
    }).sort({ order: 1 });

    if (nextLesson) {
        progress.currentLessonId = nextLesson._id as Types.ObjectId;
        await progress.save();
        return { status: 'NEXT_LESSON_UNLOCKED', nextId: nextLesson._id };
    }

    // Module Complete -> Find Next Module
    await UserProgress.updateOne(
        { _id: progress._id },
        { $addToSet: { completedModules: currentModule._id } }
    );

    const nextModule = await Module.findOne({
        instrumentId: instrumentId,
        order: { $gt: currentModule.order }
    }).sort({ order: 1 });

    if (nextModule) {
        const firstLessonOfNext = await Lesson.findOne({ moduleId: nextModule._id }).sort({ order: 1 });
        progress.currentModuleId = nextModule._id as Types.ObjectId;
        progress.currentLessonId = firstLessonOfNext ? (firstLessonOfNext._id as Types.ObjectId) : null;
        await progress.save();
        return { status: 'NEXT_MODULE_UNLOCKED', nextId: nextModule._id };
    }

    progress.isInstrumentCompleted = true;
    await progress.save();
    return { status: 'INSTRUMENT_COMPLETED' };
};

const getResumePoint = async (userId: string, instrumentId: string) => {
  const progress = await UserProgress.findOne({ userId, instrumentId })
    .populate({ path: 'currentModuleId', select: 'title' })
    .populate({ path: 'currentLessonId', select: 'title' });

  if (!progress) throw new AppError(StatusCodes.NOT_FOUND, "No progress found.");

  if (progress.isInstrumentCompleted) {
    const firstMod = await Module.findOne({ instrumentId }).sort({ order: 1 });
    const firstLess = firstMod ? await Lesson.findOne({ moduleId: firstMod._id }).sort({ order: 1 }) : null;
    return { message: "Review from start", moduleId: firstMod?._id, lessonId: firstLess?._id, isCompleted: true };
  }

  return {
    moduleId: (progress.currentModuleId as any)?._id,
    lessonId: (progress.currentLessonId as any)?._id,
    moduleTitle: (progress.currentModuleId as any)?.title,
    lessonTitle: (progress.currentLessonId as any)?.title,
    isCompleted: false
  };
};

const getLeaderboard = async () => {
  return await UserProgress.aggregate([
    { $match: { "completedLessons.0": { $exists: true } } },
    {
      $group: {
        _id: '$userId',
        totalCompletedSteps: { $sum: { $size: '$completedLessons' } },
        instrumentsStarted: { $sum: 1 }
      }
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDetails' } },
    { $unwind: '$userDetails' },
    {
      $project: {
        name: '$userDetails.name',
        username: '$userDetails.username',
        avatar: '$userDetails.avatar',
        totalCompletedSteps: 1,
        instrumentsStarted: 1
      }
    },
    { $sort: { totalCompletedSteps: -1 } },
    { $limit: 10 }
  ]);
};

export const progressService = {
    initializeProgress,
    getInstrumentDetailsWithProgress,
    updateStudentProgress,
    getResumePoint,
    getLeaderboard
};
