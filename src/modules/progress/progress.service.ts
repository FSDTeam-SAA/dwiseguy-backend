import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { Instrument } from '../instrument/instrument.model';
import { Module } from '../module/module.model';
import { Lesson } from '../lesson/lesson.model';
import { UserProgress } from './progress.model';
import { Types } from 'mongoose';
import { Quiz } from '../quiz/quiz.model';


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

  const allLessons = instrument.modules.reduce((acc: any[], mod: any) => {
    return [...acc, ...mod.lessons];
  }, []);

  const totalLessons = allLessons.length;
  const completedCount = progress?.completedLessons?.length || 0;
  const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const moduleData = instrument.modules.map((mod: any, index: number) => {
    // 1. Check if this specific module is already marked as 'passed' (quiz done)
    const isCompleted = progress?.completedModules.some(id => id.equals(mod._id));
    
    // 2. Strict Tree Logic for Unlocking:
    // - Module 1 (index 0) is ALWAYS unlocked.
    // - Others unlock ONLY if the previous module's quiz was passed (exists in completedModules).
    const previousModule = index > 0 ? instrument.modules[index - 1] : null;
    const isPreviousPassed = previousModule 
      ? progress?.completedModules.some(id => id.equals(previousModule._id)) 
      : false;

    const isUnlocked = index === 0 || isPreviousPassed;

    return {
      _id: mod._id,
      title: mod.title,
      order: mod.order,
      isUnlocked,
      isCompleted, // This means "Passed the Quiz"
      lessons: mod.lessons.map((less: any) => {
        const isLessonDone = progress?.completedLessons.some(id => id.equals(less._id));
        return {
          _id: less._id,
          title: less.title,
          isCompleted: isLessonDone,
          // Lessons are only clickable if the module is unlocked
          isLocked: !isUnlocked
        };
      })
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

  const progress = await UserProgress.findOne({ userId, instrumentId: currentModule.instrumentId });
  if (!progress) throw new AppError(StatusCodes.NOT_FOUND, "Not enrolled in this instrument");

  // 1. Mark Lesson as finished (After Exercise)
  await UserProgress.updateOne(
    { _id: progress._id },
    { $addToSet: { completedLessons: new Types.ObjectId(lessonId) } }
  );

  // 2. Check for Next Lesson in same Module
  const nextLesson = await Lesson.findOne({
    moduleId: currentModule._id,
    order: { $gt: currentLesson.order }
  }).sort({ order: 1 });

  if (nextLesson) {
    progress.currentLessonId = nextLesson._id as Types.ObjectId;
    await progress.save();
    return { status: 'NEXT_LESSON_UNLOCKED', nextId: nextLesson._id };
  }

  // 3. STOP HERE: All lessons in module done. User must now take the Module Quiz.
  return {
    status: 'MODULE_LESSONS_COMPLETED',
    message: 'All lessons completed. Please pass the Module Quiz (75%+) to unlock the next module.'
  };
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

// const getLeaderboard = async () => {
//   return await UserProgress.aggregate([
//     { $match: { "completedLessons.0": { $exists: true } } },
//     {
//       $group: {
//         _id: '$userId',
//         totalCompletedSteps: { $sum: { $size: '$completedLessons' } },
//         instrumentsStarted: { $sum: 1 }
//       }
//     },
//     { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDetails' } },
//     { $unwind: '$userDetails' },
//     {
//       $project: {
//         name: '$userDetails.name',
//         username: '$userDetails.username',
//         avatar: '$userDetails.avatar',
//         totalCompletedSteps: 1,
//         instrumentsStarted: 1
//       }
//     },
//     { $sort: { totalCompletedSteps: -1 } },
//     { $limit: 10 }
//   ]);
// };

const getLeaderboard = async () => {
  return await UserProgress.aggregate([
    // 1. Filter out records that don't have a userId (sanity check)
    { $match: { userId: { $exists: true } } },

    // 2. Group and sum while guarding against missing arrays
    {
      $group: {
        _id: '$userId',
        totalCompletedSteps: { 
          $sum: { $size: { $ifNull: ["$completedLessons", []] } } 
        },
        modulesPassed: { 
          $sum: { $size: { $ifNull: ["$completedModules", []] } } 
        },
        instrumentsStarted: { $sum: 1 }
      }
    },

    // 3. Lookup user details
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDetails' } },
    { $unwind: '$userDetails' },

    // 4. Project clean data
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$userDetails.name',
        username: '$userDetails.username',
        avatar: '$userDetails.avatar',
        totalCompletedSteps: 1,
        modulesPassed: 1,
        instrumentsStarted: 1
      }
    },

    // 5. Sort by lessons completed (or your performance score)
    { $sort: { totalCompletedSteps: -1 } },
    { $limit: 10 }
  ]);
};





const evaluateModuleQuiz = async (userId: string, quizId: string, score: number, totalMarks: number) => {
  const percentage = (score / totalMarks) * 100;
  const passPercentage = 75;

  // 1. Context Retrieval
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new AppError(StatusCodes.NOT_FOUND, "Quiz not found");

  const moduleId = quiz.moduleId;
  const currentModule = await Module.findById(moduleId);
  if (!currentModule) throw new AppError(StatusCodes.NOT_FOUND, "Module not found");

  // 2. Progress Retrieval
  const progress = await UserProgress.findOne({ 
    userId, 
    instrumentId: currentModule.instrumentId 
  });

  if (!progress) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User progress record not found.");
  }

  // --- LOGIC BRANCHING ---
  if (percentage >= passPercentage) {
    // PASS LOGIC: Unlock next level
    await UserProgress.updateOne(
      { _id: progress._id },
      { $addToSet: { completedModules: moduleId } }
    );

    const nextModule = await Module.findOne({
      instrumentId: currentModule.instrumentId,
      order: { $gt: currentModule.order }
    }).sort({ order: 1 });

    if (nextModule) {
      const firstLessonOfNext = await Lesson.findOne({ moduleId: nextModule._id }).sort({ order: 1 });
      await UserProgress.updateOne(
        { _id: progress._id },
        {
          $set: {
            currentModuleId: nextModule._id,
            currentLessonId: firstLessonOfNext ? firstLessonOfNext._id : null
          }
        }
      );
      return { status: 'PASSED', percentage, nextModuleId: nextModule._id };
    }

    await UserProgress.updateOne({ _id: progress._id }, { $set: { isInstrumentCompleted: true } });
    return { status: 'INSTRUMENT_COMPLETED', percentage };

  } else {
    // FAIL LOGIC: The Tree Pruning (Reset)
    // Find all lessons belonging to the module being failed
    const moduleLessons = await Lesson.find({ moduleId }).select('_id');
    
    // CRITICAL FIX: We create an array containing BOTH ObjectId and String formats.
    // This guarantees MongoDB finds the match regardless of how it was stored.
    const lessonObjectIds = moduleLessons.map(l => new Types.ObjectId(l._id));
    const lessonStringIds = moduleLessons.map(l => l._id.toString());
    const combinedIds = [...lessonObjectIds, ...lessonStringIds];

    const updateResult = await UserProgress.updateOne(
      { _id: progress._id },
      {
        $pull: { 
          // Pull any matching lesson ID found in this module from the progress array
          completedLessons: { $in: combinedIds } 
        },
        $set: { 
          // Move the student's pointer back to the first lesson of this module
          currentLessonId: lessonObjectIds.length > 0 ? lessonObjectIds[0] : null 
        }
      }
    );

    return {
      status: 'FAILED',
      progressStatus: 'FAILED', 
      percentage, 
      message: `Scored ${percentage}%. Module progress has been reset.`,
      data: {
          score: percentage,
          prunedCount: updateResult.modifiedCount // This should now be 1
      }
    };
  }
};


const getAdminProgressStats = async () => {
  return await UserProgress.aggregate([
    {
      $group: {
        _id: null,
        totalEnrolledStudents: { $sum: 1 },
        totalLessonsCompleted: { $sum: { $size: { $ifNull: ["$completedLessons", []] } } },
        totalModulesPassed: { $sum: { $size: { $ifNull: ["$completedModules", []] } } },
        completedCourses: { 
          $sum: { $cond: [{ $eq: ["$isInstrumentCompleted", true] }, 1, 0] } 
        }
      }
    }
  ]);
};


const getAllStudentsProgressReportFromDb = async (query: Record<string, unknown>) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // 1. Fetch total count for pagination metadata
  const total = await UserProgress.countDocuments();

  // 2. Fetch paginated, sorted, and populated records
  const reports = await UserProgress.find()
    .populate('userId', 'name email avatar')
    .populate('instrumentId', 'instrumentTitle')
    .populate('currentModuleId', 'title')
    .populate('currentLessonId', 'title')
    .sort({ updatedAt: -1 }) // Show most recent activity first
    .skip(skip)
    .limit(limit)
    .lean();

  const data = reports.map((report) => ({
    student: {
      name: (report.userId as any)?.name || 'Unknown Student',
      email: (report.userId as any)?.email || 'N/A',
      avatar: (report.userId as any)?.avatar,
    },
    course: (report.instrumentId as any)?.instrumentTitle || 'Piano Course',
    status: {
      currentModule: (report.currentModuleId as any)?.title || 'Intro',
      currentLesson: (report.currentLessonId as any)?.title || 'Starting soon',
      isCompleted: report.isInstrumentCompleted || false,
    },
    metrics: {
      lessonsDone: report.completedLessons?.length || 0,
      modulesDone: report.completedModules?.length || 0,
    },
    lastActivity: (report as any).updatedAt,
  }));

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
};


export const progressService = {
  initializeProgress,
  getInstrumentDetailsWithProgress,
  updateStudentProgress,
  getResumePoint,
  getLeaderboard,
  evaluateModuleQuiz,
  getAdminProgressStats,
  getAllStudentsProgressReportFromDb
  // checkIfLessonIsUnlocked
};
