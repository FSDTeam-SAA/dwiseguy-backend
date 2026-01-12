import AppError from '../../errors/AppError';
import { Quiz } from './quiz.model';
import { TCreateQuiz, TUpdateQuiz } from './quiz.interface';
import { QuizAttempt } from '../quizAttempt/quizAttempt.model';
import mongoose, { Types } from 'mongoose';
import { Module } from '../module/module.model';

/* ===============================
   Admin Quiz Services
================================ */

// Create Quiz
export const createQuizService = async (quizData: TCreateQuiz, adminId: string) => {
      const session = await mongoose.startSession();

      try {
            session.startTransaction();

            const existingQuiz = await Quiz.findOne({
                  quizName: quizData.quizName,
                  moduleId: quizData.moduleId,
            }).session(session);

            if (existingQuiz) {
                  throw new AppError(400, 'Quiz name must be unique within a module');
            }

            // ✅ Validate numberOfQuestionsToShow
            if (quizData.numberOfQuestionsToShow > quizData.questions.length) {
                  throw new AppError(
                        400,
                        `numberOfQuestionsToShow (${quizData.numberOfQuestionsToShow}) cannot be greater than total questions (${quizData.questions.length})`
                  );
            }

            const quiz = await Quiz.create(
                  [
                        {
                              ...quizData,
                              createdBy: adminId,
                              totalMarks: quizData.numberOfQuestionsToShow, // ✅ Updated: Set based on numberOfQuestionsToShow
                              passingPercentage: quizData.passingPercentage || 75, // ✅ NEW: Default 75%
                        },
                  ],
                  { session }
            );

            const quizObjectId = quiz[0]._id;

            const updatedModule = await Module.findOneAndUpdate(
                  { _id: quizData.moduleId },
                  { $addToSet: { quizIds: quizObjectId } },
                  { new: true, session }
            );

            if (!updatedModule) {
                  throw new AppError(404, 'Module not found');
            }

            await session.commitTransaction();
            return quiz[0];
      } catch (error) {
            await session.abortTransaction();
            throw error;
      } finally {
            session.endSession();
      }
};

// Get All Quizzes
export const getAllQuizzesService = async () => {
      const quizzes = await Quiz.find()
            .populate('createdBy', 'name email')
            .populate('moduleId', 'title')
            // .populate('lessonId', 'title') // TODO: Uncomment when needed
            .sort({ createdAt: -1 });

      return quizzes;
};

// Get Quiz by ID (Admin) - with correct answers
export const getQuizByIdService = async (quizId: string) => {
      const quiz = await Quiz.findById(quizId).populate('createdBy', 'name email').populate('moduleId', 'title');
      // .populate('lessonId', 'title'); // TODO: Uncomment when Lesson model is ready

      if (!quiz) {
            throw new AppError(404, 'Quiz not found');
      }

      return quiz;
};

// Update Quiz
export const updateQuizService = async (quizId: string, updateData: TUpdateQuiz) => {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) throw new AppError(404, 'Quiz not found');

      // Check unique quiz name within module
      if (updateData.quizName && updateData.quizName !== quiz.quizName) {
            const existingQuiz = await Quiz.findOne({
                  quizName: updateData.quizName,
                  moduleId: quiz.moduleId,
                  _id: { $ne: quizId },
            });
            if (existingQuiz) throw new AppError(400, 'Quiz name must be unique within a module');
      }

      // ✅ Validate numberOfQuestionsToShow if updating questions or numberOfQuestionsToShow
      const finalQuestions = updateData.questions || quiz.questions;
      const finalNumberOfQuestionsToShow = updateData.numberOfQuestionsToShow || quiz.numberOfQuestionsToShow;

      if (finalNumberOfQuestionsToShow > finalQuestions.length) {
            throw new AppError(
                  400,
                  `numberOfQuestionsToShow (${finalNumberOfQuestionsToShow}) cannot be greater than total questions (${finalQuestions.length})`
            );
      }

      // Update fields
      if (updateData.quizName) quiz.quizName = updateData.quizName;
      if (updateData.timeLimit) quiz.timeLimit = updateData.timeLimit;
      if (updateData.numberOfQuestionsToShow) quiz.numberOfQuestionsToShow = updateData.numberOfQuestionsToShow; // ✅ NEW
      if (updateData.passingPercentage !== undefined) quiz.passingPercentage = updateData.passingPercentage; // ✅ NEW

      // Update questions if provided
      if (updateData.questions?.length) {
            quiz.questions = updateData.questions;
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

      // Delete quizId from Module
      const updatedModule = await Module.findOneAndUpdate(
            { _id: quiz.moduleId },
            { $pull: { quizIds: quizId } },
            { new: true }
      );

      if (!updatedModule) {
            throw new AppError(500, 'Quiz delete failed. Try again.');
      }

      const deleteQuiz = await Quiz.findByIdAndDelete(quizId);
      if (!deleteQuiz) throw new AppError(500, 'Quiz delete failed. Try again.');

      return { message: `${quiz.quizName} deleted successfully`, data: quiz.quizName };
};

// Get Quiz Analytics (Admin)
export const getQuizAnalyticsService = async (quizId: string) => {
      const quiz = await Quiz.findById(quizId).select('quizName passingPercentage'); // ✅ Added passingPercentage
      if (!quiz) {
            throw new AppError(404, 'Quiz not found');
      }

      const quizObjectId = new Types.ObjectId(quizId);

      const analytics = await QuizAttempt.aggregate([
            {
                  $match: {
                        quizId: quizObjectId,
                  },
            },
            {
                  $facet: {
                        stats: [
                              {
                                    $group: {
                                          _id: null,
                                          totalAttempts: { $sum: 1 },
                                          averageScore: { $avg: '$score' },
                                          averagePercentage: { $avg: '$percentage' },
                                          highestScore: { $max: '$score' },
                                          lowestScore: { $min: '$score' },
                                          // ✅ NEW: Count pass/fail
                                          passed: {
                                                $sum: {
                                                      $cond: [{ $gte: ['$percentage', quiz.passingPercentage] }, 1, 0],
                                                },
                                          },
                                          failed: {
                                                $sum: {
                                                      $cond: [{ $lt: ['$percentage', quiz.passingPercentage] }, 1, 0],
                                                },
                                          },
                                    },
                              },
                        ],
                        recentAttempts: [
                              { $sort: { submittedAt: -1 } },
                              { $limit: 10 },
                              {
                                    $lookup: {
                                          from: 'users',
                                          localField: 'studentId',
                                          foreignField: '_id',
                                          as: 'student',
                                    },
                              },
                              { $unwind: '$student' },
                              {
                                    $project: {
                                          _id: 0,
                                          score: 1,
                                          percentage: 1,
                                          submittedAt: 1,
                                          studentName: '$student.name',
                                          studentEmail: '$student.email',
                                          // ✅ NEW: Show pass/fail status
                                          status: {
                                                $cond: [
                                                      { $gte: ['$percentage', quiz.passingPercentage] },
                                                      'Passed',
                                                      'Failed',
                                                ],
                                          },
                                    },
                              },
                        ],
                  },
            },
            {
                  $project: {
                        stats: { $arrayElemAt: ['$stats', 0] },
                        recentAttempts: 1,
                  },
            },
      ]);

      const stats = analytics[0]?.stats;

      return {
            quizName: quiz.quizName,
            passingPercentage: quiz.passingPercentage, // ✅ NEW
            totalAttempts: stats?.totalAttempts || 0,
            passed: stats?.passed || 0, // ✅ NEW
            failed: stats?.failed || 0, // ✅ NEW
            passRate: stats?.totalAttempts ? Number(((stats.passed / stats.totalAttempts) * 100).toFixed(2)) : 0, // ✅ NEW
            averageScore: stats?.averageScore ? Number(stats.averageScore.toFixed(2)) : 0,
            averagePercentage: stats?.averagePercentage ? Number(stats.averagePercentage.toFixed(2)) : 0,
            highestScore: stats?.highestScore || 0,
            lowestScore: stats?.lowestScore || 0,
            recentAttempts: analytics[0]?.recentAttempts || [],
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
