import { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import { Quiz } from '../quiz/quiz.model';
import { TSubmitQuiz } from './quizAttempt.interface';
import { QuizAttempt } from './quizAttempt.model';
import { progressService } from '../progress/progress.service';
import { UserProgress } from '../progress/progress.model';
import { Module } from '../module/module.model';

export const getQuizForStudentService = async (quizId: string, studentId: string) => {
      //console.log('student', studentId);

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
            throw new AppError(404, 'Quiz not found');
      }

      const module = await Module.findById(quiz.moduleId);
      //console.log('mosule', module);
      if (!module || module.lessons.length === 0) {
            throw new AppError(404, 'Module not found or has no lessons');
      }

      const lastLessonOfModule = module.lessons[module.lessons.length - 1].toString();
      //console.log('lastlesson', lastLessonOfModule);

      const studentProgress = await UserProgress.findOne({
            userId: studentId,
      });

      if (!studentProgress) {
            throw new AppError(400, 'Student progress not found');
      }

      const isLastLessonCompleted = studentProgress.completedLessons.some(
            (lessonId) => lessonId.toString() === lastLessonOfModule
      );
      //console.log('hgfyfytf', studentProgress.completedLessons);
      if (!isLastLessonCompleted) {
            throw new AppError(400, 'You have not completed the last lesson of this module yets');
      }

      let questionsToShow = [...quiz.questions];

      if (quiz.numberOfQuestionsToShow < quiz.questions.length) {
            questionsToShow = questionsToShow.sort(() => Math.random() - 0.5);
            questionsToShow = questionsToShow.slice(0, quiz.numberOfQuestionsToShow);
      }

      const quizForStudent = {
            _id: quiz._id,
            quizName: quiz.quizName,
            timeLimit: quiz.timeLimit,
            totalMarks: quiz.totalMarks,
            numberOfQuestions: quiz.numberOfQuestionsToShow,
            passingPercentage: quiz.passingPercentage,
            questions: questionsToShow.map((question) => ({
                  questionId: question._id,
                  questionText: question.questionText,
                  options: question.options.map((option) => ({
                        optionText: option.optionText,
                  })),
            })),
      };

      return quizForStudent;
};

export const submitQuizService = async (submitData: TSubmitQuiz, studentId: string) => {
      const { quizId, answers, timeTaken } = submitData;

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
            throw new AppError(404, 'Quiz not found');
      }

      // const existingAttempt = await QuizAttempt.findOne({ quizId, studentId });
      // if (existingAttempt) {
      //       throw new AppError(400, 'You have already attempted this quiz. Only one attempt is allowed.');
      // }

      const maxTimeInSeconds = quiz.timeLimit * 60;
      if (timeTaken > maxTimeInSeconds) {
            throw new AppError(400, `Time limit exceeded. Maximum time allowed: ${quiz.timeLimit} minutes`);
      }

      let answersToGrade = answers;
      if (answers.length > quiz.numberOfQuestionsToShow) {
            answersToGrade = answers.sort(() => Math.random() - 0.5).slice(0, quiz.numberOfQuestionsToShow);
      }

      let score = 0;
      const detailedAnswers = answersToGrade.map((studentAnswer) => {
            const question = quiz.questions.find((q) => q._id!.toString() === studentAnswer.questionId);
            if (!question) {
                  throw new AppError(400, `Invalid question ID: ${studentAnswer.questionId}`);
            }

            const correctOption = question.options.find((opt) => opt.isCorrect);
            if (!correctOption) {
                  throw new AppError(500, 'Quiz data is corrupted. No correct option found.');
            }

            const isCorrect =
                  studentAnswer.selectedOption.trim().toLowerCase() === correctOption.optionText.trim().toLowerCase();

            if (isCorrect) {
                  score++;
            }

            return {
                  questionId: studentAnswer.questionId,
                  selectedOption: studentAnswer.selectedOption,
                  isCorrect,
                  correctOption: correctOption.optionText,
            };
      });

      const percentage = (score / quiz.totalMarks) * 100;

      let status: 'pass' | 'retake_suggested' | 'must_retake';
      if (percentage >= 75) {
            status = 'pass';
      } else if (percentage >= 50) {
            status = 'retake_suggested';
      } else {
            status = 'must_retake';
      }

      // Save quiz attempt
      const quizAttempt = await QuizAttempt.create({
            quizId,
            studentId,
            answers: detailedAnswers,
            score,
            totalMarks: quiz.totalMarks,
            percentage: parseFloat(percentage.toFixed(2)),
            timeTaken,
            status,
            submittedAt: new Date(),
      });

      const progressResult = await progressService.evaluateModuleQuiz(studentId, quizId, score, quiz.totalMarks);

      return {
            quizName: quiz.quizName,
            attemptId: quizAttempt._id,
            score,
            totalMarks: quiz.totalMarks,
            percentage: parseFloat(percentage.toFixed(2)),
            progressStatus: progressResult.status,
            timeTaken,
            status,
            passingPercentage: quiz.passingPercentage,
            message: getStatusMessage(status, percentage),
      };
};

function getStatusMessage(status: string, percentage: number): string {
      switch (status) {
            case 'pass':
                  return `Congratulations! You passed with ${percentage}%. You can proceed to the next module.`;
            case 'retake_suggested':
                  return `You scored ${percentage}%. You can retake this quiz to improve your score, or proceed to the next module.`;
            case 'must_retake':
                  return `You scored ${percentage}%. You must retake and pass this quiz before proceeding to the next module.`;
            default:
                  return '';
      }
}

export const getDetailedQuizResultsService = async (quizId: string, studentId: string) => {
      const attempt = await QuizAttempt.findOne({ quizId, studentId }).populate(
            'quizId',
            'quizName timeLimit totalMarks passingPercentage'
      );

      if (!attempt) {
            throw new AppError(404, 'Quiz attempt not found');
      }

      return {
            quizName: (attempt?.quizId as any)?.quizName,
            score: attempt.score,
            totalMarks: attempt.totalMarks,
            percentage: attempt.percentage,
            passingPercentage: (attempt?.quizId as any)?.passingPercentage,
            status: attempt.status,
            timeTaken: attempt.timeTaken,
            submittedAt: attempt.submittedAt,
            detailedResults: attempt.answers,
      };
};

export const getStudentQuizResultService = async (quizId: string, studentId: string) => {
      const attempt = await QuizAttempt.findOne({ quizId, studentId }).populate(
            'quizId',
            'quizName timeLimit totalMarks passingPercentage'
      );

      if (!attempt) {
            throw new AppError(404, 'Quiz attempt not found');
      }

      return {
            quizName: (attempt?.quizId as any)?.quizName,
            score: attempt.score,
            totalMarks: attempt.totalMarks,
            percentage: attempt.percentage,
            passingPercentage: (attempt?.quizId as any)?.passingPercentage,
            status: attempt.status, // ✅ NEW
            timeTaken: attempt.timeTaken,
            submittedAt: attempt.submittedAt,
      };
};

export const getStudentAllAttemptsService = async (studentId: string) => {
      const result = await QuizAttempt.aggregate([
            {
                  $match: {
                        studentId: new Types.ObjectId(studentId),
                  },
            },

            {
                  $lookup: {
                        from: 'quizzes',
                        localField: 'quizId',
                        foreignField: '_id',
                        as: 'quiz',
                  },
            },

            {
                  $unwind: {
                        path: '$quiz',
                        preserveNullAndEmptyArrays: true,
                  },
            },

            {
                  $sort: { submittedAt: -1 },
            },

            {
                  $group: {
                        _id: null,
                        totalQuizzesAttempted: { $sum: 1 },
                        totalScore: { $sum: '$score' },
                        averagePercentage: { $avg: '$percentage' },

                        totalPassed: {
                              $sum: {
                                    $cond: [{ $eq: ['$status', 'pass'] }, 1, 0],
                              },
                        },
                        total_Retake_Suggested: {
                              $sum: {
                                    $cond: [{ $eq: ['$status', 'retake_suggested'] }, 1, 0],
                              },
                        },
                        totalFailed: {
                              $sum: {
                                    $cond: [{ $eq: ['$status', 'must_retake'] }, 1, 0],
                              },
                        },
                        attempts: {
                              $push: {
                                    attemptId: '$_id',
                                    quizId: '$quiz._id',
                                    quizName: {
                                          $ifNull: ['$quiz.quizName', 'Quiz Deleted'],
                                    },
                                    score: '$score',
                                    totalMarks: '$totalMarks',
                                    percentage: '$percentage',
                                    status: '$status',
                                    submittedAt: '$submittedAt',
                              },
                        },
                  },
            },

            {
                  $project: {
                        _id: 0,
                        totalQuizzesAttempted: 1,
                        totalScore: 1,
                        totalPassed: 1,
                        total_Retake_Suggested: 1,
                        totalFailed: 1,
                        averagePercentage: {
                              $round: ['$averagePercentage', 2],
                        },
                        attempts: 1,
                  },
            },
      ]);

      return (
            result[0] || {
                  totalQuizzesAttempted: 0,
                  totalScore: 0,
                  totalPassed: 0,
                  totalFailed: 0,
                  averagePercentage: 0,
                  attempts: [],
            }
      );
};

export const hasStudentAttemptedQuizService = async (quizId: string, studentId: string) => {
      const attempt = await QuizAttempt.findOne({ quizId, studentId });
      return !!attempt;
};
