import AppError from '../../errors/AppError';
import { Quiz } from './quiz.model';
import { QuizAttempt } from './quizAttempt.model';
import { TSubmitQuiz } from './quizAttempt.interface';

/* ===============================
   Student Quiz Attempt Services
================================ */

// Get Quiz for Student (without correct answers)
export const getQuizForStudentService = async (quizId: string, studentId: string) => {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
            throw new AppError(404, 'Quiz not found');
      }

      // Check if student has already attempted this quiz
      const existingAttempt = await QuizAttempt.findOne({ quizId, studentId });
      if (existingAttempt) {
            throw new AppError(400, 'You have already attempted this quiz. Only one attempt is allowed.');
      }

      // Return quiz without showing correct answers
      const quizForStudent = {
            _id: quiz._id,
            quizName: quiz.quizName,
            timeLimit: quiz.timeLimit,
            totalMarks: quiz.totalMarks,
            questions: quiz.questions.map((question) => ({
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

// Submit Quiz and Calculate Score
// Submit Quiz and Calculate Score
export const submitQuizService = async (submitData: TSubmitQuiz, studentId: string) => {
      const { quizId, answers, timeTaken } = submitData;

      // Validate quiz exists
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
            throw new AppError(404, 'Quiz not found');
      }

      // Check if student has already attempted
      const existingAttempt = await QuizAttempt.findOne({ quizId, studentId });
      if (existingAttempt) {
            throw new AppError(400, 'You have already attempted this quiz. Only one attempt is allowed.');
      }

      // Validate time limit (20 minutes = 1200 seconds)
      const maxTimeInSeconds = quiz.timeLimit * 60;
      if (timeTaken > maxTimeInSeconds) {
            throw new AppError(400, `Time limit exceeded. Maximum time allowed: ${quiz.timeLimit} minutes`);
      }

      // Calculate score and prepare detailed results
      let score = 0;
      const detailedAnswers = answers.map((studentAnswer) => {
            // ✅ Find the question by _id instead of questionText
            const question = quiz.questions.find((q) => q._id.toString() === studentAnswer.questionId);
            if (!question) {
                  throw new AppError(400, `Invalid question ID: ${studentAnswer.questionId}`);
            }

            // Find the correct option from options array
            const correctOption = question.options.find((opt) => opt.isCorrect);
            if (!correctOption) {
                  throw new AppError(500, 'Quiz data is corrupted. No correct option found.');
            }

            // Check if student's answer matches the correct option text
            const isCorrect =
                  studentAnswer.selectedOption.trim().toLowerCase() === correctOption.optionText.trim().toLowerCase();

            if (isCorrect) {
                  score++;
            }

            return {
                  questionId: studentAnswer.questionId, // ✅ Store questionId instead of questionText
                  selectedOption: studentAnswer.selectedOption,
                  isCorrect,
                  correctOption: correctOption.optionText,
            };
      });

      // Calculate percentage
      const percentage = (score / quiz.totalMarks) * 100;

      // Save quiz attempt
      const quizAttempt = await QuizAttempt.create({
            quizId,
            studentId,
            answers: detailedAnswers,
            score,
            totalMarks: quiz.totalMarks,
            percentage: parseFloat(percentage.toFixed(2)),
            timeTaken,
            submittedAt: new Date(),
      });

      return {
            attemptId: quizAttempt._id,
            score,
            totalMarks: quiz.totalMarks,
            percentage: parseFloat(percentage.toFixed(2)),
            timeTaken,
            detailedResults: detailedAnswers, // Show correct/wrong answers
      };
};

// Get Student's Specific Quiz Result
export const getStudentQuizResultService = async (quizId: string, studentId: string) => {
      const attempt = await QuizAttempt.findOne({ quizId, studentId }).populate(
            'quizId',
            'quizName timeLimit totalMarks'
      );

      if (!attempt) {
            throw new AppError(404, 'Quiz attempt not found');
      }

      return {
            quizName: (attempt.quizId as any).quizName,
            score: attempt.score,
            totalMarks: attempt.totalMarks,
            percentage: attempt.percentage,
            timeTaken: attempt.timeTaken,
            submittedAt: attempt.submittedAt,
            detailedResults: attempt.answers,
      };
};

// Rest of the code remains same...

// Get All Student's Quiz Attempts (Student Dashboard)
export const getStudentAllAttemptsService = async (studentId: string) => {
      const attempts = await QuizAttempt.find({ studentId })
            .populate('quizId', 'quizName timeLimit totalMarks')
            .sort({ submittedAt: -1 });

      const totalQuizzes = attempts.length;
      const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
      const averagePercentage =
            totalQuizzes > 0 ? attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / totalQuizzes : 0;

      return {
            totalQuizzesAttempted: totalQuizzes,
            totalScore,
            averagePercentage: parseFloat(averagePercentage.toFixed(2)),
            attempts: attempts.map((attempt) => ({
                  quizId: attempt.quizId._id,
                  quizName: (attempt.quizId as any).quizName,
                  score: attempt.score,
                  totalMarks: attempt.totalMarks,
                  percentage: attempt.percentage,
                  submittedAt: attempt.submittedAt,
            })),
      };
};

// Check if student has attempted a quiz
export const hasStudentAttemptedQuizService = async (quizId: string, studentId: string) => {
      const attempt = await QuizAttempt.findOne({ quizId, studentId });
      return !!attempt;
};
