import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { Instrument } from '../instrument/instrument.model';
import { Module } from '../module/module.model';
import { Lesson } from '../lesson/lesson.model';
import { UserProgress } from './progress.model';
import { Types } from 'mongoose';
import { Quiz } from '../quiz/quiz.model';
import { QuizAttempt } from '../quizAttempt/quizAttempt.model';
import { ExerciseContent } from '../exerciseContent/exerciseContent.model';

const initializeProgress = async (userId: string, instrumentId: string) => {
      const instObjId = new Types.ObjectId(instrumentId);
      const userObjId = new Types.ObjectId(userId);

      const instrumentExists = await Instrument.findById(instObjId);
      if (!instrumentExists) throw new AppError(StatusCodes.NOT_FOUND, 'Instrument not found.');

      const firstModule = await Module.findOne({ instrumentId: instObjId }).sort({ order: 1 });
      if (!firstModule) throw new AppError(StatusCodes.BAD_REQUEST, 'This instrument has no modules yet.');

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
            populate: { path: 'lessons', options: { sort: { order: 1 } } },
      });

      if (!instrument) throw new AppError(StatusCodes.NOT_FOUND, 'Instrument not found');

      const progress = await UserProgress.findOne({ userId, instrumentId });

      // Flatten all lessons across all modules for progress bar
      const allLessons = instrument.modules.reduce((acc: any[], mod: any) => {
            return [...acc, ...mod.lessons];
      }, []);

      const totalLessons = allLessons.length;
      const completedCount = progress?.completedLessons?.length || 0;
      const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      const moduleData = instrument.modules.map((mod: any, index: number) => {
            const isCompleted = progress?.completedModules.some((id) => id.equals(mod._id));
            const isCurrent = progress?.currentModuleId?.equals(mod._id);
            const previousModule = index > 0 ? instrument.modules[index - 1] : null;
            const isPreviousCompleted = previousModule
                  ? progress?.completedModules.some((id) => id.equals(previousModule._id))
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
                        isCompleted: progress?.completedLessons.some((id) => id.equals(less._id)),
                        isLocked: !isUnlocked,
                  })),
            };
      });

      return {
            instrumentTitle: instrument.instrumentTitle,
            stats: { totalLessons, completedLessons: completedCount, completionPercentage },
            isInstrumentCompleted: progress?.isInstrumentCompleted || false,
            modules: moduleData,
      };
};

const updateStudentProgress = async (userId: string, lessonId: string) => {
      const currentLesson = await Lesson.findById(lessonId);
      if (!currentLesson) throw new AppError(StatusCodes.NOT_FOUND, 'Lesson not found');

      const currentModule = await Module.findById(currentLesson.moduleId);
      if (!currentModule) throw new AppError(StatusCodes.NOT_FOUND, 'Parent Module not found');

      const instrumentId = currentModule.instrumentId;
      //console.log(userId, instrumentId, 'jsrogtjerwoijgo');
      const progress = await UserProgress.findOne({ userId, instrumentId });
      if (!progress) throw new AppError(StatusCodes.NOT_FOUND, 'Not enrolled in this instrument');

      // Mark Lesson as finished
      await UserProgress.updateOne(
            { _id: progress._id },
            { $addToSet: { completedLessons: new Types.ObjectId(lessonId) } }
      );

      // Check for Next Lesson in same Module
      const nextLesson = await Lesson.findOne({
            moduleId: currentModule._id,
            order: { $gt: currentLesson.order },
      }).sort({ order: 1 });

      if (nextLesson) {
            progress.currentLessonId = nextLesson._id as Types.ObjectId;
            await progress.save();
            return { status: 'NEXT_LESSON_UNLOCKED', nextId: nextLesson._id };
      }

      // Module Complete -> Find Next Module
      await UserProgress.updateOne({ _id: progress._id }, { $addToSet: { completedModules: currentModule._id } });

      const nextModule = await Module.findOne({
            instrumentId: instrumentId,
            order: { $gt: currentModule.order },
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

export const completeModuleService = async (userId: string, moduleId: string) => {
      // 1️⃣ Module validate
      const module = await Module.findById(moduleId);
      if (!module) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Module not found');
      }

      // 2️⃣ User progress validate
      const progress = await UserProgress.findOne({
            userId,
            instrumentId: module.instrumentId,
      });

      if (!progress) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'User not enrolled in this instrument');
      }

      // 3️⃣ Quiz validation (BEST attempt)
      if (!module.quizIds || module.quizIds.length === 0) {
            throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'No quiz configured for this module');
      }

      // Find user's best attempt among module quizzes
      const bestAttempt = await QuizAttempt.findOne({
            studentId: userId,
            quizId: { $in: module.quizIds },
      }).sort({ percentage: -1, createdAt: -1 });

      if (!bestAttempt) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'No quiz attempt found for this module');
      }

      if (bestAttempt.status == 'must_retake') {
            return {
                  status: 'QUIZ_NOT_PASSED',
                  quizStatus: bestAttempt.status,
            };
      }

      // 4️⃣ Mark module completed
      await UserProgress.updateOne({ _id: progress._id }, { $addToSet: { completedModules: module._id } });

      // 5️⃣ Find next module
      const nextModule = await Module.findOne({
            instrumentId: module.instrumentId,
            order: { $gt: module.order },
      }).sort({ order: 1 });

      if (nextModule) {
            const firstLesson = await Lesson.findOne({
                  moduleId: nextModule._id,
            }).sort({ order: 1 });

            progress.currentModuleId = nextModule._id as Types.ObjectId;
            progress.currentLessonId = firstLesson ? (firstLesson._id as Types.ObjectId) : null;

            await progress.save();

            return {
                  status: 'NEXT_MODULE_UNLOCKED',
                  nextModuleId: nextModule._id,
            };
      }

      // 6️⃣ Instrument completed
      progress.isInstrumentCompleted = true;
      progress.completedInstruments.push(module.instrumentId);
      progress.currentModuleId = null;
      progress.currentLessonId = null;

      await progress.save();

      return {
            status: 'INSTRUMENT_COMPLETED',
      };
};

const getResumePoint = async (userId: string, instrumentId: string) => {
      const progress = await UserProgress.findOne({ userId, instrumentId })
            .populate({ path: 'currentModuleId', select: 'title' })
            .populate({ path: 'currentLessonId', select: 'title' });

      if (!progress) throw new AppError(StatusCodes.NOT_FOUND, 'No progress found.');

      if (progress.isInstrumentCompleted) {
            const firstMod = await Module.findOne({ instrumentId }).sort({ order: 1 });
            const firstLess = firstMod ? await Lesson.findOne({ moduleId: firstMod._id }).sort({ order: 1 }) : null;
            return {
                  message: 'Review from start',
                  moduleId: firstMod?._id,
                  lessonId: firstLess?._id,
                  isCompleted: true,
            };
      }

      return {
            moduleId: (progress.currentModuleId as any)?._id,
            lessonId: (progress.currentLessonId as any)?._id,
            moduleTitle: (progress.currentModuleId as any)?.title,
            lessonTitle: (progress.currentLessonId as any)?.title,
            isCompleted: false,
      };
};

const getLeaderboard = async () => {
      return await UserProgress.aggregate([
            { $match: { 'completedLessons.0': { $exists: true } } },
            {
                  $group: {
                        _id: '$userId',
                        totalCompletedSteps: { $sum: { $size: '$completedLessons' } },
                        instrumentsStarted: { $sum: 1 },
                  },
            },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDetails' } },
            { $unwind: '$userDetails' },
            {
                  $project: {
                        name: '$userDetails.name',
                        username: '$userDetails.username',
                        avatar: '$userDetails.avatar',
                        totalCompletedSteps: 1,
                        instrumentsStarted: 1,
                  },
            },
            { $sort: { totalCompletedSteps: -1 } },
            { $limit: 10 },
      ]);
};

const getAdminProgressStats = async () => {
      return await UserProgress.aggregate([
            {
                  $group: {
                        _id: null,
                        totalEnrolledStudents: { $sum: 1 },
                        totalLessonsCompleted: { $sum: { $size: { $ifNull: ['$completedLessons', []] } } },
                        totalModulesPassed: { $sum: { $size: { $ifNull: ['$completedModules', []] } } },
                        completedCourses: {
                              $sum: { $cond: [{ $eq: ['$isInstrumentCompleted', true] }, 1, 0] },
                        },
                  },
            },
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

const evaluateModuleQuiz = async (userId: string, quizId: string, score: number, totalMarks: number) => {
      const percentage = (score / totalMarks) * 100;
      const passPercentage = 75;

      // 1. Context Retrieval
      const quiz = await Quiz.findById(quizId);
      if (!quiz) throw new AppError(StatusCodes.NOT_FOUND, 'Quiz not found');

      const moduleId = quiz.moduleId;
      const currentModule = await Module.findById(moduleId);
      if (!currentModule) throw new AppError(StatusCodes.NOT_FOUND, 'Module not found');

      // 2. Progress Retrieval
      const progress = await UserProgress.findOne({
            userId,
            instrumentId: currentModule.instrumentId,
      });

      if (!progress) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'User progress record not found.');
      }

      // --- LOGIC BRANCHING ---
      if (percentage >= passPercentage) {
            // PASS LOGIC: Unlock next level
            await UserProgress.updateOne({ _id: progress._id }, { $addToSet: { completedModules: moduleId } });

            const nextModule = await Module.findOne({
                  instrumentId: currentModule.instrumentId,
                  order: { $gt: currentModule.order },
            }).sort({ order: 1 });

            if (nextModule) {
                  const firstLessonOfNext = await Lesson.findOne({ moduleId: nextModule._id }).sort({ order: 1 });
                  await UserProgress.updateOne(
                        { _id: progress._id },
                        {
                              $set: {
                                    currentModuleId: nextModule._id,
                                    currentLessonId: firstLessonOfNext ? firstLessonOfNext._id : null,
                              },
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
            const lessonObjectIds = moduleLessons.map((l) => new Types.ObjectId(l._id));
            const lessonStringIds = moduleLessons.map((l) => l._id.toString());
            const combinedIds = [...lessonObjectIds, ...lessonStringIds];

            const updateResult = await UserProgress.updateOne(
                  { _id: progress._id },
                  {
                        $pull: {
                              // Pull any matching lesson ID found in this module from the progress array
                              completedLessons: { $in: combinedIds },
                        },
                        $set: {
                              // Move the student's pointer back to the first lesson of this module
                              currentLessonId: lessonObjectIds.length > 0 ? lessonObjectIds[0] : null,
                        },
                  }
            );

            return {
                  status: 'FAILED',
                  progressStatus: 'FAILED',
                  percentage,
                  message: `Scored ${percentage}%. Module progress has been reset.`,
                  data: {
                        score: percentage,
                        prunedCount: updateResult.modifiedCount, // This should now be 1
                  },
            };
      }
};


const getGlobalProfileStats = async (userId: string) => {
      const userObjId = new Types.ObjectId(userId);

      // 1. Get User Progress records
      const userProgressRecords = await UserProgress.find({ userId: userObjId }).lean();

      if (!userProgressRecords.length) return { lessonsPercent: 0, exercisesPercent: 0, quizPercent: 0 };

      // 2. Parallel fetch totals for ALL enrolled instruments
      const instrumentIds = userProgressRecords.map(p => p.instrumentId);

      const [totalLessons, totalExercises] = await Promise.all([
            Lesson.countDocuments({ instrumentId: { $in: instrumentIds } }),
            ExerciseContent.countDocuments({ isActive: true }), // Adjust if exercises are instrument-specific
      ]);

      // 3. Aggregate Completed across all instruments
      const totalCompletedLessons = userProgressRecords.reduce((acc, p) => acc + p.completedLessons.length, 0);
      const totalCompletedExercises = userProgressRecords.reduce((acc, p) => acc + p.completedExercises.length, 0);

      // 4. Global Quiz Average
      const quizStats = await QuizAttempt.aggregate([
            { $match: { studentId: userObjId } },
            { $group: { _id: "$quizId", bestScore: { $max: "$percentage" } } },
            { $group: { _id: null, avgScore: { $avg: "$bestScore" } } }
      ]);

      return {
            lessonsCompleted: totalLessons > 0 ? Math.round((totalCompletedLessons / totalLessons) * 100) : 0,
            exercisesCompleted: totalExercises > 0 ? Math.round((totalCompletedExercises / totalExercises) * 100) : 0,
            quizzesCompleted: Math.round(quizStats[0]?.avgScore || 0),
            enrolledInstruments: userProgressRecords.length
      };
};


export const progressService = {
      initializeProgress,
      getInstrumentDetailsWithProgress,
      updateStudentProgress,
      getResumePoint,
      getLeaderboard,
      getAllStudentsProgressReportFromDb,
      getAdminProgressStats,
      evaluateModuleQuiz,
      getGlobalProfileStats
};
