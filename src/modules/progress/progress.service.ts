import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { Course } from '../course/course.model';
import { Lesson } from '../module/module.model';
import { UserProgress } from './progress.model';
import { Types } from 'mongoose';
import { SubLesson } from '../lesson/lesson.model';

const initializeProgress = async (userId: string, courseId: string) => {

const courseObjId = new Types.ObjectId(courseId);

    // 1. Verify this is actually a Course ID
    const courseExists = await Course.findById(courseObjId);
    if (!courseExists) {
        throw new AppError(StatusCodes.NOT_FOUND, "The provided ID does not belong to a valid Course.");
    }

    // 2. Now search for lessons
    const firstLesson = await Lesson.findOne({ courseId: courseObjId }).sort({ order: 1 });
    
    if (!firstLesson) {
        throw new AppError(StatusCodes.BAD_REQUEST, "This course exists but has no lessons added yet.");
    }

    // Explicitly cast to ObjectId
    const userObjId = new Types.ObjectId(userId);
    // const courseObjId = new Types.ObjectId(courseId);

    const existingProgress = await UserProgress.findOne({ 
        userId: userObjId, 
        courseId: courseObjId 
    });
    
    if (existingProgress) return existingProgress;

    // FIND LESSON: Ensure we use the ObjectId here
    // const firstLesson = await Lesson.findOne({ courseId: courseObjId }).sort({ order: 1 });
    
    // This is where your error is triggering
    if (!firstLesson) {
        throw new AppError(StatusCodes.BAD_REQUEST, `No lessons found for Course ID: ${courseId}`);
    }

    const firstSub = await SubLesson.findOne({ lessonId: firstLesson._id }).sort({ order: 1 });

    return await UserProgress.create({
        userId: userObjId,
        courseId: courseObjId,
        currentLessonId: firstLesson._id,
        currentSubLessonId: firstSub ? firstSub._id : null,
    });
};

const getCourseDetailsWithProgress = async (userId: string, courseId: string) => {
    // 1. Fetch Course with nested Lessons and Sublessons
    const course = await Course.findById(courseId).populate({
        path: 'lessons',
        options: { sort: { order: 1 } },
        populate: { path: 'sublessons', options: { sort: { order: 1 } } }
    });

    if (!course) throw new AppError(StatusCodes.NOT_FOUND, "Course not found");

    // 2. Fetch User Progress
    const progress = await UserProgress.findOne({ userId, courseId });

    // 3. DYNAMIC PERCENTAGE CALCULATION
    // Flatten all sublessons from all lessons into one array to get the total count
    const allSubLessons = course.lessons.reduce((acc: any[], lesson: any) => {
        return [...acc, ...lesson.sublessons];
    }, []);

    const totalSubLessons = allSubLessons.length;
    const completedCount = progress?.completedSubLessons?.length || 0;

    // Calculate percentage (handle division by zero if course is empty)
    const completionPercentage = totalSubLessons > 0
        ? Math.round((completedCount / totalSubLessons) * 100)
        : 0;

    // 4. Map the hierarchy (Same logic as before)
    const lessonData = course.lessons.map((lesson: any, index: number) => {
        const isCompleted = progress?.completedLessons.some(id => id.equals(lesson._id));
        const isCurrent = progress?.currentLessonId?.equals(lesson._id);

        // Check if previous lesson was completed to unlock current
        const previousLesson = index > 0 ? course.lessons[index - 1] : null;
        const isPreviousCompleted = previousLesson
            ? progress?.completedLessons.some(id => id.equals(previousLesson._id))
            : false;

        const isUnlocked = index === 0 || isCompleted || isCurrent || isPreviousCompleted;

        return {
            _id: lesson._id,
            title: lesson.title,
            order: lesson.order,
            isUnlocked,
            isCompleted: isCompleted || false,
            sublessons: lesson.sublessons.map((sub: any) => ({
                _id: sub._id,
                title: sub.title,
                order: sub.order,
                isCompleted: progress?.completedSubLessons.some(id => id.equals(sub._id)),
                isLocked: !isUnlocked
            }))
        };
    });

    return {
        courseTitle: course.courseTitle,
        stats: {
            totalSubLessons,
            completedSubLessons: completedCount,
            completionPercentage // The dynamic value for your progress bar
        },
        isCourseCompleted: progress?.isCourseCompleted || false,
        lessons: lessonData
    };
};

const updateStudentProgress = async (userId: string, subLessonId: string) => {
    // 1. Find the Sublesson
    const currentSub = await SubLesson.findById(subLessonId);
    if (!currentSub) throw new AppError(StatusCodes.NOT_FOUND, "Sublesson not found");

    // 2. Find the Parent Lesson to get the Course ID (Climbing the ladder)
    const currentLesson = await Lesson.findById(currentSub.lessonId);
    if (!currentLesson) throw new AppError(StatusCodes.NOT_FOUND, "Parent Lesson not found");

    const courseId = currentLesson.courseId; // This is the ID we need for Progress

    // 3. Find/Update the UserProgress record
    const progress = await UserProgress.findOne({ userId, courseId });
    if (!progress) throw new AppError(StatusCodes.NOT_FOUND, "Student is not enrolled in this course");

    // 4. Mark Sublesson as finished ($addToSet avoids duplicates)
    await UserProgress.updateOne(
        { _id: progress._id },
        { $addToSet: { completedSubLessons: new Types.ObjectId(subLessonId) } }
    );

    // 5. Logic: Find if there is a Next Sublesson in this lesson
    const nextSub = await SubLesson.findOne({
        lessonId: currentLesson._id,
        order: { $gt: currentSub.order }
    }).sort({ order: 1 });

    if (nextSub) {
        progress.currentSubLessonId = nextSub._id as Types.ObjectId;
        await progress.save();
        return { status: 'NEXT_SUB_UNLOCKED', nextId: nextSub._id };
    }

    // 6. No more Sublessons? Complete this Lesson and find the Next Lesson
    await UserProgress.updateOne(
        { _id: progress._id },
        { $addToSet: { completedLessons: currentLesson._id } }
    );

    const nextLesson = await Lesson.findOne({
        courseId: courseId,
        order: { $gt: currentLesson.order }
    }).sort({ order: 1 });

    if (nextLesson) {
        const firstSubOfNext = await SubLesson.findOne({ lessonId: nextLesson._id }).sort({ order: 1 });

        progress.currentLessonId = nextLesson._id as Types.ObjectId;
        progress.currentSubLessonId = firstSubOfNext ? (firstSubOfNext._id as Types.ObjectId) : null;
        await progress.save();
        return { status: 'NEXT_LESSON_UNLOCKED', nextId: nextLesson._id };
    }

    // 7. If no next lesson, the course is complete
    progress.isCourseCompleted = true;
    await progress.save();
    return { status: 'COURSE_COMPLETED' };
};


const getResumePoint = async (userId: string, courseId: string) => {
  // 1. Fetch progress and populate the objects
  const progress = await UserProgress.findOne({ userId, courseId })
    .populate({ path: 'currentLessonId', select: 'title' })
    .populate({ path: 'currentSubLessonId', select: 'title' });

  if (!progress) {
    throw new AppError(StatusCodes.NOT_FOUND, "No progress found. Please start the course first.");
  }

  // 2. Logic for Course Completion
  if (progress.isCourseCompleted) {
    const firstLesson = await Lesson.findOne({ courseId }).sort({ order: 1 });
    // Find the first sublesson of that lesson
    const firstSub = firstLesson 
      ? await SubLesson.findOne({ lessonId: firstLesson._id }).sort({ order: 1 }) 
      : null;

    return {
      message: "Course completed! You can review from the start.",
      lessonTitle: firstLesson?.title || "Beginning",
      subLessonTitle: firstSub?.title || "First Exercise",
      lessonId: firstLesson?._id,
      subLessonId: firstSub?._id,
      isCourseCompleted: true
    };
  }

  // 3. Logic for Standard Resume (Student is in the middle of a course)
  // Use 'any' to avoid TS errors with Mongoose Document types for .title access
  const currentLesson = progress.currentLessonId as any;
  const currentSub = progress.currentSubLessonId as any;

  return {
    message: "Continue your practice",
    lessonTitle: currentLesson?.title || "Next Lesson",
    subLessonTitle: currentSub?.title || "Next Exercise",
    lessonId: currentLesson?._id,
    subLessonId: currentSub?._id,
    isCourseCompleted: false
  };
};



const getLeaderboard = async () => {
  const result = await UserProgress.aggregate([
    // 1. Only look at records where something has been completed
    { 
      $match: { 
        "completedSubLessons.0": { $exists: true } 
      } 
    },
    // 2. Group by User to sum progress across all courses
    {
      $group: {
        _id: '$userId',
        totalCompletedSteps: { $sum: { $size: '$completedSubLessons' } },
        coursesStarted: { $sum: 1 }
      }
    },
    // 3. Join with 'users' collection
    {
      $lookup: {
        from: 'users', 
        localField: '_id',
        foreignField: '_id',
        as: 'userDetails'
      }
    },
    // 4. Flatten the user array
    { $unwind: '$userDetails' },
    // 5. Select fields based on your provided User Schema
    {
      $project: {
        _id: 1,
        totalCompletedSteps: 1,
        coursesStarted: 1,
        name: '$userDetails.name',
        username: '$userDetails.username',
        avatar: '$userDetails.avatar', // This is an object in your DB
        role: '$userDetails.role'
      }
    },
    // 6. Sort by top performer
    { $sort: { totalCompletedSteps: -1 } },
    { $limit: 10 }
  ]);

  return result;
};

export const progressService = {

    initializeProgress,
    getCourseDetailsWithProgress,
    updateStudentProgress,
    getResumePoint,
    getLeaderboard
};