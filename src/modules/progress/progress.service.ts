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

// const getInstrumentDetailsWithProgress = async (userId: string, instrumentId: string) => {
//   const instrument = await Instrument.findById(instrumentId).populate({
//     path: 'modules',
//     options: { sort: { order: 1 } },
//     populate: { path: 'lessons', options: { sort: { order: 1 } } }
//   });

//   if (!instrument) throw new AppError(StatusCodes.NOT_FOUND, "Instrument not found");

//   const progress = await UserProgress.findOne({ userId, instrumentId });

//   // Flatten all lessons across all modules for progress bar
//   const allLessons = instrument.modules.reduce((acc: any[], mod: any) => {
//     return [...acc, ...mod.lessons];
//   }, []);

//   const totalLessons = allLessons.length;
//   const completedCount = progress?.completedLessons?.length || 0;
//   const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

//   const moduleData = instrument.modules.map((mod: any, index: number) => {
//     const isCompleted = progress?.completedModules.some(id => id.equals(mod._id));
//     const isCurrent = progress?.currentModuleId?.equals(mod._id);
//     const previousModule = index > 0 ? instrument.modules[index - 1] : null;
//     const isPreviousCompleted = previousModule
//       ? progress?.completedModules.some(id => id.equals(previousModule._id))
//       : false;

//     const isUnlocked = index === 0 || isCompleted || isCurrent || isPreviousCompleted;

//     return {
//       _id: mod._id,
//       title: mod.title,
//       order: mod.order,
//       isUnlocked,
//       isCompleted: isCompleted || false,
//       lessons: mod.lessons.map((less: any) => ({
//         _id: less._id,
//         title: less.title,
//         isCompleted: progress?.completedLessons.some(id => id.equals(less._id)),
//         isLocked: !isUnlocked
//       }))
//     };
//   });

//   return {
//     instrumentTitle: instrument.instrumentTitle,
//     stats: { totalLessons, completedLessons: completedCount, completionPercentage },
//     isInstrumentCompleted: progress?.isInstrumentCompleted || false,
//     modules: moduleData
//   };
// };

// const updateStudentProgress = async (userId: string, lessonId: string) => {
//     const currentLesson = await Lesson.findById(lessonId);
//     if (!currentLesson) throw new AppError(StatusCodes.NOT_FOUND, "Lesson not found");

//     const currentModule = await Module.findById(currentLesson.moduleId);
//     if (!currentModule) throw new AppError(StatusCodes.NOT_FOUND, "Parent Module not found");

//     const instrumentId = currentModule.instrumentId;

//     const progress = await UserProgress.findOne({ userId, instrumentId });
//     if (!progress) throw new AppError(StatusCodes.NOT_FOUND, "Not enrolled in this instrument");

//     // Mark Lesson as finished
//     await UserProgress.updateOne(
//         { _id: progress._id },
//         { $addToSet: { completedLessons: new Types.ObjectId(lessonId) } }
//     );

//     // Check for Next Lesson in same Module
//     const nextLesson = await Lesson.findOne({
//         moduleId: currentModule._id,
//         order: { $gt: currentLesson.order }
//     }).sort({ order: 1 });

//     if (nextLesson) {
//         progress.currentLessonId = nextLesson._id as Types.ObjectId;
//         await progress.save();
//         return { status: 'NEXT_LESSON_UNLOCKED', nextId: nextLesson._id };
//     }

//     // Module Complete -> Find Next Module
//     await UserProgress.updateOne(
//         { _id: progress._id },
//         { $addToSet: { completedModules: currentModule._id } }
//     );

//     const nextModule = await Module.findOne({
//         instrumentId: instrumentId,
//         order: { $gt: currentModule.order }
//     }).sort({ order: 1 });

//     if (nextModule) {
//         const firstLessonOfNext = await Lesson.findOne({ moduleId: nextModule._id }).sort({ order: 1 });
//         progress.currentModuleId = nextModule._id as Types.ObjectId;
//         progress.currentLessonId = firstLessonOfNext ? (firstLessonOfNext._id as Types.ObjectId) : null;
//         await progress.save();
//         return { status: 'NEXT_MODULE_UNLOCKED', nextId: nextModule._id };
//     }

//     progress.isInstrumentCompleted = true;
//     await progress.save();
//     return { status: 'INSTRUMENT_COMPLETED' };
// };


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

// const checkIfLessonIsUnlocked = async (userId: string | Types.ObjectId, lessonId: string) => {
//     const lessonObjId = new Types.ObjectId(lessonId);

//     const lesson = await Lesson.findById(lessonObjId);
//     if (!lesson) throw new AppError(StatusCodes.NOT_FOUND, "Lesson not found");

//     const currentModule = await Module.findById(lesson.moduleId);
//     if (!currentModule) throw new AppError(StatusCodes.NOT_FOUND, "Module not found");

//     const progress = await UserProgress.findOne({ 
//         userId: new Types.ObjectId(userId), 
//         instrumentId: currentModule.instrumentId 
//     });

//     if (!progress) return false;

//     const isCompleted = progress.completedLessons.some(id => id.equals(lessonObjId));
//     const isCurrent = progress.currentLessonId?.equals(lessonObjId);

//     // First lesson of the first module is always open
//     const isFirstLessonOverall = lesson.order === 1 && currentModule.order === 1;

//     return isCompleted || isCurrent || isFirstLessonOverall;
// };


// const evaluateModuleQuiz = async (userId: string, quizId: string, score: number, totalMarks: number) => {
//   const percentage = (score / totalMarks) * 100;
//   const passPercentage = 75;

//   // Find the quiz and the module it belongs to
//   const quiz = await Quiz.findById(quizId);
//   if (!quiz) throw new AppError(StatusCodes.NOT_FOUND, "Quiz not found");

//   const moduleId = quiz.moduleId;
//   const currentModule = await Module.findById(moduleId);
//   const progress = await UserProgress.findOne({ userId, instrumentId: currentModule?.instrumentId });

//   // ADD THIS GUARD CLAUSE
//   if (!progress) {
//     throw new AppError(StatusCodes.BAD_REQUEST, "User progress record not found. Please start the instrument first.");
//   }

//   if (percentage >= passPercentage) {
//     // --- PASS LOGIC ---
//     await UserProgress.updateOne(
//       { _id: progress?._id },
//       { $addToSet: { completedModules: moduleId } }
//     );

//     // Find Next Module
//     const nextModule = await Module.findOne({
//       instrumentId: currentModule?.instrumentId,
//       order: { $gt: currentModule?.order }
//     }).sort({ order: 1 });

//     if (nextModule) {
//       const firstLessonOfNext = await Lesson.findOne({ moduleId: nextModule._id }).sort({ order: 1 });
//       progress!.currentModuleId = nextModule._id as Types.ObjectId;
//       progress!.currentLessonId = firstLessonOfNext ? (firstLessonOfNext._id as Types.ObjectId) : null;
//       await progress!.save();
//       return { status: 'PASSED', nextModuleId: nextModule._id };
//     }

//     progress!.isInstrumentCompleted = true;
//     await progress!.save();
//     return { status: 'INSTRUMENT_COMPLETED' };

//   } else {
//     // --- FAIL LOGIC (The Tree Reset) ---
//     // Find all lessons for this specific module
//     const moduleLessons = await Lesson.find({ moduleId }).select('_id');
//     const lessonIds = moduleLessons.map(l => l._id);

//     // Reset: Remove these lessons from completedLessons and set pointer to first lesson
//     await UserProgress.updateOne(
//       { _id: progress?._id },
//       {
//         $pull: { completedLessons: { $in: lessonIds } },
//         $set: { currentLessonId: lessonIds[0] }
//       }
//     );

//     return {
//       status: 'FAILED',
//       message: `Scored ${percentage}%. You must score 75% to pass. Module progress has been reset.`,
//       score: percentage
//     };
//   }
// };

// const evaluateModuleQuiz = async (userId: string, quizId: string, score: number, totalMarks: number) => {
//   const percentage = (score / totalMarks) * 100;
//   const passPercentage = 75;

//   const quiz = await Quiz.findById(quizId);
//   if (!quiz) throw new AppError(StatusCodes.NOT_FOUND, "Quiz not found");

//   const moduleId = quiz.moduleId;
//   const currentModule = await Module.findById(moduleId);
  
//   // LOGIC FIX: Ensure we use the exact instrumentId from the module
//   const progress = await UserProgress.findOne({ 
//     userId, 
//     instrumentId: currentModule?.instrumentId 
//   });

//   if (!progress) {
//     throw new AppError(StatusCodes.BAD_REQUEST, "User progress record not found.");
//   }

//   if (percentage >= passPercentage) {
//     // ... (Keep your existing PASS logic here)
//     // Ensure you return { ..., percentage } so the test script reads it
//   } else {
//     // --- FAIL LOGIC (The Tree Reset) ---
    
//     // 1. Find all lessons for THIS module
//     const moduleLessons = await Lesson.find({ moduleId }).select('_id');
    
//     // 2. CRITICAL FIX: Convert ObjectIds to Strings to ensure the $pull matches 
//     // the array elements regardless of how they were stored.
//     const lessonIds = moduleLessons.map(l => l._id.toString());

//     // 3. Reset the Tree Branch
//     const updateResult = await UserProgress.updateOne(
//       { _id: progress._id },
//       {
//         $pull: { 
//           // We use $in with stringified IDs for maximum compatibility
//           completedLessons: { $in: lessonIds } 
//         },
//         $set: { 
//           // Reset pointer to the first lesson of this failed module
//           currentLessonId: lessonIds.length > 0 ? new Types.ObjectId(lessonIds[0]) : null 
//         }
//       }
//     );

//     // console.log(`Tree Pruned: ${updateResult.modifiedCount} lessons removed`);

//     return {
//       status: 'FAILED',
//       percentage, // Use 'percentage' instead of 'score' to match the test script
//       message: `Scored ${percentage}%. Module progress has been reset.`,
//     };
//   }
// };


// const evaluateModuleQuiz = async (userId: string, quizId: string, score: number, totalMarks: number) => {
//   const percentage = (score / totalMarks) * 100;
//   const passPercentage = 75;

//   // 1. Fetch Quiz and Module Context
//   const quiz = await Quiz.findById(quizId);
//   if (!quiz) throw new AppError(StatusCodes.NOT_FOUND, "Quiz not found");

//   const moduleId = quiz.moduleId;
//   const currentModule = await Module.findById(moduleId);
//   if (!currentModule) throw new AppError(StatusCodes.NOT_FOUND, "Module not found");

//   // 2. Fetch User Progress (The Tree Root)
//   const progress = await UserProgress.findOne({ 
//     userId, 
//     instrumentId: currentModule.instrumentId 
//   });

//   if (!progress) {
//     throw new AppError(StatusCodes.BAD_REQUEST, "User progress record not found. Please start the instrument first.");
//   }

//   // --- BRANCHING LOGIC ---
//   if (percentage >= passPercentage) {
//     /**
//      * PASS LOGIC: Unlock Next Level
//      */
//     await UserProgress.updateOne(
//       { _id: progress._id },
//       { $addToSet: { completedModules: moduleId } }
//     );

//     const nextModule = await Module.findOne({
//       instrumentId: currentModule.instrumentId,
//       order: { $gt: currentModule.order }
//     }).sort({ order: 1 });

//     if (nextModule) {
//       const firstLessonOfNext = await Lesson.findOne({ moduleId: nextModule._id }).sort({ order: 1 });
      
//       await UserProgress.updateOne(
//         { _id: progress._id },
//         {
//           $set: {
//             currentModuleId: nextModule._id,
//             currentLessonId: firstLessonOfNext ? firstLessonOfNext._id : null
//           }
//         }
//       );
//       return { 
//         status: 'PASSED', 
//         percentage, 
//         nextModuleId: nextModule._id,
//         message: `Congrats! You passed with ${percentage}%` 
//       };
//     }

//     // No next module? Instrument finished.
//     await UserProgress.updateOne(
//       { _id: progress._id },
//       { $set: { isInstrumentCompleted: true } }
//     );
//     return { status: 'INSTRUMENT_COMPLETED', percentage };

//   } else {
//     /**
//      * FAIL LOGIC: Tree Pruning
//      */
//     // Find all lessons belonging to this module
//     const moduleLessons = await Lesson.find({ moduleId }).select('_id');
    
//     // CRITICAL: Map to both ObjectId and String to ensure MongoDB finds a match 
//     // regardless of how the ID was originally saved in the array.
//     const lessonObjectIds = moduleLessons.map(l => new Types.ObjectId(l._id));
//     const lessonStringIds = moduleLessons.map(l => l._id.toString());
//     const combinedIds = [...lessonObjectIds, ...lessonStringIds];

//     const updateResult = await UserProgress.updateOne(
//       { _id: progress._id },
//       {
//         $pull: { 
//           // Pull any matching lesson ID found in this module
//           completedLessons: { $in: combinedIds } 
//         },
//         $set: { 
//           // Reset their current position to the start of this module
//           currentLessonId: lessonObjectIds.length > 0 ? lessonObjectIds[0] : null 
//         }
//       }
//     );

//     return {
//       status: 'FAILED',
//       progressStatus: 'FAILED', // Keep both for script/Postman compatibility
//       percentage, 
//       message: `Scored ${percentage}%. Module progress has been reset.`,
//       prunedCount: updateResult.modifiedCount // Useful for debugging
//     };
//   }
// };







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





export const progressService = {
  initializeProgress,
  getInstrumentDetailsWithProgress,
  updateStudentProgress,
  getResumePoint,
  getLeaderboard,
  evaluateModuleQuiz
  // checkIfLessonIsUnlocked
};
