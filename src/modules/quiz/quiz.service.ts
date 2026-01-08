import AppError from '../../errors/AppError';
import { Quiz } from './quiz.model';

import { TCreateQuiz, TUpdateQuiz } from './quiz.interface';
import { QuizAttempt } from '../quizAttempt/quizAttempt.model';

// Create Quiz
export const createQuizService = async (quizData: TCreateQuiz, adminId: string) => {
      // Check if quiz name already exists for this class
      const existingQuiz = await Quiz.findOne({
            quizName: quizData.quizName,
            lessonId: quizData.lessonId,
      });
      if (existingQuiz) {
            throw new AppError(400, 'Quiz name must be unique within a class');
      }

      const quiz = await Quiz.create({
            ...quizData,
            createdBy: adminId,
            totalMarks: 20,
      });

      return quiz;
};

export const getAllQuizzesService = async () => {
      const quizzes = await Quiz.find()
            .populate('createdBy', 'name email')
            .populate('moduleId', 'title')
            .populate('lessonId', 'title')
            .sort({ createdAt: -1 });

      return quizzes;
};

export const getQuizByIdService = async (quizId: string) => {
      const quiz = await Quiz.findById(quizId).populate('createdBy', 'name email');
      // .populate('lessonId', 'lessonTitle') // TODO: Uncomment when Lesson model is ready
      // .populate('classId', 'className'); // TODO: Uncomment when Class model is ready

      if (!quiz) {
            throw new AppError(404, 'Quiz not found');
      }

      return quiz;
};

// Update Quiz
export const updateQuizService = async (quizId: string, updateData: TUpdateQuiz) => {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) throw new AppError(404, 'Quiz not found');

      if (updateData.quizName && updateData.quizName !== quiz.quizName) {
            const existingQuiz = await Quiz.findOne({
                  quizName: updateData.quizName,
                  classId: quiz.lessonId,
                  _id: { $ne: quizId },
            });
            if (existingQuiz) throw new AppError(400, 'Quiz name must be unique within a class');
      }

      if (updateData.quizName) quiz.quizName = updateData.quizName;
      if (updateData.timeLimit) quiz.timeLimit = updateData.timeLimit;

      if (updateData.questions?.length) {
            updateData.questions.forEach((updatedQuestion) => {
                  const question = quiz.questions.find((q) => q._id!.toString() === updatedQuestion._id);
                  if (!question) throw new AppError(404, 'Question not found');

                  question.questionText = updatedQuestion.questionText;
                  question.options = updatedQuestion.options;
            });
      }

      await quiz.save();
      return quiz;
};

// Delete Quiz
export const deleteQuizService = async (quizId: string) => {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
            throw new AppError(404, 'Quiz not found');
      }

      // Check if any students have attempted this quiz
      const attemptCount = await QuizAttempt.countDocuments({ quizId });
      if (attemptCount > 0) {
            throw new AppError(400, `Cannot delete quiz. ${attemptCount} student(s) have already attempted it.`);
      }

      await Quiz.findByIdAndDelete(quizId);
      return { message: 'Quiz deleted successfully' };
};

// Get Quiz Analytics (Admin)
export const getQuizAnalyticsService = async (quizId: string) => {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
            throw new AppError(404, 'Quiz not found');
      }

      const attempts = await QuizAttempt.find({ quizId }).populate('studentId', 'name email');

      const totalAttempts = attempts.length;
      const averageScore =
            totalAttempts > 0 ? attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts : 0;
      const averagePercentage =
            totalAttempts > 0 ? attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / totalAttempts : 0;
      const highestScore = totalAttempts > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;
      const lowestScore = totalAttempts > 0 ? Math.min(...attempts.map((a) => a.score)) : 0;

      // TODO: Calculate completion rate when you have total enrolled students
      // const completionRate = (totalAttempts / totalEnrolledStudents) * 100;

      return {
            quizName: quiz.quizName,
            totalAttempts,
            averageScore: parseFloat(averageScore.toFixed(2)),
            averagePercentage: parseFloat(averagePercentage.toFixed(2)),
            highestScore,
            lowestScore,
            // completionRate, // TODO: Add when you have enrollment data
            recentAttempts: attempts.slice(0, 10).map((attempt) => ({
                  studentName: (attempt.studentId as any).name,
                  studentEmail: (attempt.studentId as any).email,
                  score: attempt.score,
                  percentage: attempt.percentage,
                  submittedAt: attempt.submittedAt,
            })),
      };
};

// Get Leaderboard (Admin View)
export const getLeaderboardService = async () => {
      const leaderboard = await QuizAttempt.aggregate([
            {
                  $group: {
                        _id: '$studentId',
                        totalScore: { $sum: '$score' },
                        totalQuizzes: { $count: {} },
                        averagePercentage: { $avg: '$percentage' },
                  },
            },
            {
                  $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'student',
                  },
            },
            {
                  $unwind: '$student',
            },
            {
                  $project: {
                        studentId: '$_id',
                        studentName: '$student.name',
                        studentEmail: '$student.email',
                        studentAvatar: '$student.avatar.url',
                        totalScore: 1,
                        totalQuizzes: 1,
                        averagePercentage: { $round: ['$averagePercentage', 2] },
                  },
            },
            {
                  $sort: { totalScore: -1 },
            },
      ]);

      // Add rank
      const leaderboardWithRank = leaderboard.map((entry, index) => ({
            rank: index + 1,
            ...entry,
      }));

      return leaderboardWithRank;
};

// TODO: Add these when Lesson/Class models are ready
// - getQuizzesByLessonId
// - getQuizzesByClassId
// - getQuizzesByCourseId
