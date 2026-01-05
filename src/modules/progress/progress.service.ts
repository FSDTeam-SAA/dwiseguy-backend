// progress.service.ts
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { Course } from '../course/course.model';
import { Lesson } from '../lesson/lesson.model';
import { Sublesson } from '../sublesson/sublesson.model';
import { UserProgress } from './progress.model';
import { title } from 'node:process';
import { Types } from 'mongoose';

// progress.service.ts

const initializeProgress = async (userId: string, courseId: string) => {
  // 1. Check if progress already exists
  const existingProgress = await UserProgress.findOne({ userId, courseId });
  if (existingProgress) return existingProgress;

  // 2. Find the "Starting" Lesson (Dynamically find the lowest order)
  const firstLesson = await Lesson.findOne({ courseId })
    .sort({ order: 1 }) // Sorts ascending: 1, 2, 3 or 5, 10, 15... 
    .limit(1);

  if (!firstLesson) {
    throw new AppError(StatusCodes.BAD_REQUEST, "This course has no lessons yet.");
  }

  // 3. Find the "Starting" Sublesson (Dynamically find the lowest order)
  const firstSubLesson = await Sublesson.findOne({ 
    lessonId: firstLesson._id 
  })
  .sort({ order: 1 })
  .limit(1);

  // 4. Create record pointing to whatever the lowest order was
  const newProgress = await UserProgress.create({
    userId,
    courseId,
    currentLessonId: firstLesson._id,
    currentSubLessonId: firstSubLesson?._id || null, 
    completedSubLessons: [],
    completedLessons: [],
    isCourseCompleted: false
  });

  return newProgress;
};

const getCourseDetailsWithProgress = async (userId: string, courseId: string) => {
  // 1. Fetch Course with nested Lessons and Sublessons
  const course = await Course.findById(courseId).populate({
    path: 'lessons',
    populate: { path: 'sublessons' }
  });

  if (!course) throw new AppError(StatusCodes.NOT_FOUND, "Course not found");

  // 2. Fetch User Progress
  const progress = await UserProgress.findOne({ userId, courseId });

  // 3. Map progress status to the data (Senior approach: Don't modify DB, just return mapped data)
  const lessonData = course.lessons.map((lesson: any) => {
    const isLessonCompleted = progress?.completedLessons.includes(lesson._id);
    const isCurrentLesson = progress?.currentLessonId?.toString() === lesson._id.toString();
    
    // Logic: A lesson is unlocked if it's the first one, completed, or the current one
    const isUnlocked = lesson.order === 1 || isLessonCompleted || isCurrentLesson;

    return {
      ...lesson.toObject(),
      isUnlocked,
      isCompleted: isLessonCompleted,
      sublessons: lesson.sublessons.map((sub: any) => ({
        ...sub.toObject(),
        isCompleted: progress?.completedSubLessons.includes(sub._id),
        isLocked: !isUnlocked // Simple logic: if lesson is locked, all subs are locked
      }))
    };
  });

  return {
    courseName: course.courseTitle,
    progress: progress ? {
      completedCount: progress.completedSubLessons.length,
      isCourseCompleted: progress.isCourseCompleted
    } : null,
    lessons: lessonData
  };
};

const updateStudentProgress = async (userId: string, subLessonId: string) => {
  // 1. Validate the Sublesson and get its parent Lesson
  const currentSub = await Sublesson.findById(subLessonId);
  if (!currentSub) throw new AppError(StatusCodes.NOT_FOUND, "Sublesson not found");

  const lessonId = currentSub.lessonId;
  const currentLesson = await Lesson.findById(lessonId);
  if (!currentLesson) throw new AppError(StatusCodes.NOT_FOUND, "Parent Lesson not found");

  // 2. Mark this sublesson as completed (Idempotent)
  const progress = await UserProgress.findOneAndUpdate(
    { userId, courseId: currentLesson.courseId },
    { $addToSet: { completedSubLessons: subLessonId } },
    { new: true, upsert: true }
  );

  // 3. FIND NEXT SUBLESSON (In the same lesson)
  const nextSub = await Sublesson.findOne({
    lessonId: lessonId,
    order: { $gt: currentSub.order } // Find the next one by order
  }).sort({ order: 1 });

  if (nextSub) {
    progress.currentSubLessonId = nextSub._id as Types.ObjectId;
    await progress.save();
    return { 
        status: 'SUBLESSON_UNLOCKED', 
        nextId: nextSub._id, 
        message: "Moving to next part of the lesson." 
    };
  }

  // 4. NO MORE SUBS: Mark the whole Lesson as completed
  await UserProgress.findOneAndUpdate(
    { userId, courseId: currentLesson.courseId },
    { $addToSet: { completedLessons: lessonId } }
  );

  // 5. FIND NEXT LESSON (In the same course)
  const nextLesson = await Lesson.findOne({
    courseId: currentLesson.courseId,
    order: { $gt: currentLesson.order }
  }).sort({ order: 1 });

  if (nextLesson) {
    // Find the first sublesson of that new lesson to point the student there
    const firstSubOfNext = await Sublesson.findOne({ lessonId: nextLesson._id }).sort({ order: 1 });
    
    progress.currentLessonId = nextLesson._id as Types.ObjectId;
    progress.currentSubLessonId = (firstSubOfNext?._id || null) as Types.ObjectId;
    await progress.save();
    
    return { 
        status: 'LESSON_UNLOCKED', 
        nextId: nextLesson._id, 
        message: "Lesson complete! New lesson unlocked." 
    };
  }

  // 6. FINISHED ENTIRE COURSE
  progress.isCourseCompleted = true;
  await progress.save();
  return { status: 'COURSE_COMPLETED', message: "You've finished the entire course!" };
};

export const progressService = {
  initializeProgress,
  getCourseDetailsWithProgress,
   updateStudentProgress 
};