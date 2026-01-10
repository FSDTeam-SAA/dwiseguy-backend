import AppError from '../../errors/AppError';
import { Quiz } from './quiz.model';

import { TCreateQuiz, TUpdateQuiz } from './quiz.interface';
import { QuizAttempt } from '../quizAttempt/quizAttempt.model';
import mongoose, { Types } from 'mongoose';
import { Lesson } from '../lesson/lesson.model';
import { User } from '../user/user.model';
import { Module } from '../module/module.model';

// Create Quiz
export const createQuizService = async (quizData: TCreateQuiz, adminId: string) => {
      const session = await mongoose.startSession();

      try {
            session.startTransaction();

            const existingQuiz = await Quiz.findOne({
                  quizName: quizData.quizName,
                  lessonId: quizData.moduleId,
            }).session(session);

            if (existingQuiz) {
                  throw new AppError(400, 'Quiz name must be unique within a lesson');
            }

            const quiz = await Quiz.create(
                  [
                        {
                              ...quizData,
                              createdBy: adminId,
                              totalMarks: 20,
                        },
                  ],
                  { session }
            );

            const quizObjectId = quiz[0]._id;

            const updatedLesson = await Module.findOneAndUpdate(
                  { _id: quizData.moduleId },
                  { $addToSet: { quizIds: quizObjectId } },
                  { new: true, session }
            );

            if (!updatedLesson) {
                  throw new AppError(404, 'module not found');
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
            if (existingQuiz) throw new AppError(400, 'Quiz name must be unique within a lesson');
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

      // Delete quizId from Lesson
      const updatedLesson = await Lesson.findOneAndUpdate(
            { _id: quiz.lessonId },
            { $set: { quizId: null } },
            { new: true }
      );
      if (!updatedLesson) {
            throw new AppError(500, 'Quiz delete failed. Try again.');
      }

      const deleteQuiz = await Quiz.findByIdAndDelete(quizId);
      if (!deleteQuiz) throw new AppError(500, 'Quiz delete failed. Try again.');
      return { message: `${quiz.quizName} deleted successfully`, data: quiz.quizName };
};

// Get Quiz Analytics (Admin)
export const getQuizAnalyticsService = async (quizId: string) => {
      const quiz = await Quiz.findById(quizId).select('quizName');
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
            totalAttempts: stats?.totalAttempts || 0,
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
