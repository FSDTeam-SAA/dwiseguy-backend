import { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import { Quiz } from '../quiz/quiz.model';
import { TSubmitQuiz } from './quizAttempt.interface';
import { QuizAttempt } from './quizAttempt.model';
import { progressService } from '../progress/progress.service';
import { UserProgress } from '../progress/progress.model';
import { Module } from '../module/module.model';

/* ===============================
   Student Quiz Attempt Services
================================ */

// Get Quiz for Student (without correct answers)
export const getQuizForStudentService = async (quizId: string, studentId: string) => {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
            throw new AppError(404, 'Quiz not found');
      }
      const moduleId = quiz.moduleId;
      const module = await Module.findById(moduleId);
      console.log('module: ', module);
      const lastLessonOfModule = module!.lessons[module!.lessons.length - 1].toString();
      console.log('lastLessonOfModule', lastLessonOfModule);
      //student progress operation
      const studenProgress = await UserProgress.findOne({ userId: studentId });
      const currentLessonId = studenProgress?.currentLessonId!.toString();
      console.log('studenProgress', studenProgress);
      console.log('studentID: ', studentId);
      console.log('Current lesson id: ', currentLessonId);
      if (lastLessonOfModule !== currentLessonId) {
            throw new AppError(400, 'You have not completed this module yet');
      }

      //  Shuffle questions
      let questionsToShow = [...quiz.questions];

      if (quiz.numberOfQuestionsToShow < quiz.questions.length) {
            // Shuffle all questions
            questionsToShow = questionsToShow.sort(() => Math.random() - 0.5);
            // Take only the required number
            questionsToShow = questionsToShow.slice(0, quiz.numberOfQuestionsToShow);
      }

      // Return quiz without showing correct answers
      const quizForStudent = {
            _id: quiz._id,
            quizName: quiz.quizName,
            timeLimit: quiz.timeLimit,
            totalMarks: quiz.totalMarks, // This is already = numberOfQuestionsToShow
            numberOfQuestions: quiz.numberOfQuestionsToShow, // Tell student how many to answer
            passingPercentage: quiz.passingPercentage, //Show passing percentage
            questions: questionsToShow.map((question) => ({
                  questionId: question._id,
                  questionText: question.questionText,
                  options: question.options.map((option) => ({
                        optionText: option.optionText,
                        // Do NOT send isCorrect field to student
                  })),
            })),
      };

      return quizForStudent;
};

// ✅ Submit Quiz and Calculate Score (Updated)
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

      // NEW: Validate answer count
      // if (answers.length < quiz.numberOfQuestionsToShow) {
      //       throw new AppError(
      //             400,
      //             `You must answer at least ${quiz.numberOfQuestionsToShow} questions. You answered ${answers.length}.`
      //       );
      // }

      // NEW: If student submitted more answers than required, randomly select
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

      // NEW: Determine pass/fail status
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
            status, // ✅ NEW: Save status
            submittedAt: new Date(),
      });

      // Update progress if needed (commented for now, uncomment when ready)
      // if (quiz.lessonId) {
      //       await progressService.updateStudentProgress(studentId, quiz.lessonId.toString());
      // }
      // 2. TRIGGER PROGRESS UPDATE
      //  pass the studentId and the lessonId that belongs to this quiz
      // await progressService.updateStudentProgress(studentId, quiz.lessonId.toString());

      // Call the progress service to handle the 75% pass/fail logic
    const progressResult = await progressService.evaluateModuleQuiz(
        studentId, 
        quizId, 
        score, 
        quiz.totalMarks
    );
=========
      // Update progress if needed (commented for now, uncomment when ready)
      // if (quiz.lessonId) {
      //       await progressService.updateStudentProgress(studentId, quiz.lessonId.toString());
      // }
      // 2. TRIGGER PROGRESS UPDATE
      //  pass the studentId and the lessonId that belongs to this quiz
      await progressService.updateStudentProgress(studentId, quiz.lessonId.toString());

      // Call the progress service to handle the 75% pass/fail logic
      const progressResult = await progressService.evaluateModuleQuiz(studentId, quizId, score, quiz.totalMarks);

      // ✅ NEW: Return response WITHOUT detailed answers (hide correct answers initially)
      return {
            attemptId: quizAttempt._id,
            score,
            totalMarks: quiz.totalMarks,
            percentage: parseFloat(percentage.toFixed(2)),
            // progressStatus: progressResult.status, // Tells UI if they PASSED or FAILED/RESET,z
            timeTaken,
            status, // ✅ NEW: pass/retake_suggested/must_retake
            passingPercentage: quiz.passingPercentage,
            message: getStatusMessage(status, percentage), // ✅ NEW: User-friendly message
            // detailedResults will be available via separate endpoint
      };
};

// ✅ Helper function for status messages
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

// ✅ NEW: Get Detailed Quiz Results (Separate endpoint to view correct/wrong answers)
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
            detailedResults: attempt.answers, // ✅ Show correct/wrong answers
      };
};

// Get Student's Specific Quiz Result (Basic info only)
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
            // NO detailedResults here - use separate endpoint
      };
};

// ✅ Get All Student Attempts (Using Aggregation for efficiency)
export const getStudentAllAttemptsService = async (studentId: string) => {
      const result = await QuizAttempt.aggregate([
            // 1. Match student
            {
                  $match: {
                        studentId: new Types.ObjectId(studentId),
                  },
            },

            // 2. Join with Quiz collection
            {
                  $lookup: {
                        from: 'quizzes',
                        localField: 'quizId',
                        foreignField: '_id',
                        as: 'quiz',
                  },
            },

            // 3. Unwind quiz (handle deleted quizzes)
            {
                  $unwind: {
                        path: '$quiz',
                        preserveNullAndEmptyArrays: true, // ✅ Keep attempts even if quiz deleted
                  },
            },

            // 4. Sort by latest
            {
                  $sort: { submittedAt: -1 },
            },

            // 5. Group for summary + attempts
            {
                  $group: {
                        _id: null,
                        totalQuizzesAttempted: { $sum: 1 },
                        totalScore: { $sum: '$score' },
                        averagePercentage: { $avg: '$percentage' },
                        // ✅ NEW: Count by status
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
                                          $ifNull: ['$quiz.quizName', 'Quiz Deleted'], // ✅ Handle deleted quizzes
                                    },
                                    score: '$score',
                                    totalMarks: '$totalMarks',
                                    percentage: '$percentage',
                                    status: '$status', // ✅ NEW
                                    submittedAt: '$submittedAt',
                              },
                        },
                  },
            },

            // 6. Project final shape
            {
                  $project: {
                        _id: 0,
                        totalQuizzesAttempted: 1,
                        totalScore: 1,
                        totalPassed: 1,
                        total_Retake_Suggested: 1, // ✅ NEW
                        totalFailed: 1, // ✅ NEW
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

// Check if student has attempted quiz
export const hasStudentAttemptedQuizService = async (quizId: string, studentId: string) => {
      const attempt = await QuizAttempt.findOne({ quizId, studentId });
      return !!attempt;
};
