import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../utils/axiosConfig";

const QuizResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [quiz, setQuiz] = useState(location.state?.quiz || null);
  const [answers, setAnswers] = useState(location.state?.answers || {});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(!quiz);
  const [timeTakenSeconds, setTimeTakenSeconds] = useState(location.state?.timeTakenSeconds || null);
  const [timeTakenMinutes, setTimeTakenMinutes] = useState(location.state?.timeTakenMinutes || null);
  const [submissionTime, setSubmissionTime] = useState(location.state?.submissionTime || null);

  useEffect(() => {
    if (!quiz) {
      fetchQuiz();
    } else {
      calculateResults();
    }
  }, [quiz]);

  const fetchQuiz = async () => {
    try {
      const response = await api.get(`/quizzes/${id}`);
      setQuiz(response.data);
    } catch (error) {
      console.error("Error fetching quiz:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateResults = () => {
    if (!quiz) return;

    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    const questionResults = [];

    let answeredCount = 0;
    
    quiz.questions.forEach((question, qIndex) => {
      totalPoints += question.points;
      const userAnswer = answers[qIndex];
      const isAnswered = userAnswer !== undefined && userAnswer !== null && userAnswer !== "";
      
      if (!isAnswered) {
        // Question not answered - still add to results but mark as unanswered
        questionResults.push({
          question,
          userAnswer: null,
          isCorrect: false,
          isAnswered: false,
          correctAnswerText: question.questionType === "short-answer" 
            ? question.correctAnswer 
            : question.options.find(opt => opt.isCorrect)?.text || "",
        });
        return; // Skip counting this question
      }
      
      answeredCount++;
      let isCorrect = false;
      let correctAnswerText = "";

      if (question.questionType === "short-answer") {
        const userAnswerLower = (userAnswer || "").toLowerCase().trim();
        const correctAnswerLower = (question.correctAnswer || "").toLowerCase().trim();
        isCorrect = userAnswerLower === correctAnswerLower;
        correctAnswerText = question.correctAnswer;
      } else {
        // Multiple choice or true/false
        const correctOptionIndex = question.options.findIndex(
          (opt) => opt.isCorrect
        );
        isCorrect = userAnswer === correctOptionIndex;
        correctAnswerText = question.options[correctOptionIndex]?.text || "";
      }

      if (isCorrect) {
        correctCount++;
        earnedPoints += question.points;
      }

      questionResults.push({
        question,
        userAnswer,
        isCorrect,
        isAnswered: true,
        correctAnswerText,
      });
    });

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = percentage >= quiz.passMark;
    
    // Calculate wrong count based on answered questions only
    // Wrong = answered questions - correct answers
    const wrongCount = answeredCount - correctCount;

    setResults({
      correctCount,
      wrongCount,
      answeredCount,
      totalQuestions: quiz.questions.length,
      earnedPoints,
      totalPoints,
      percentage: percentage.toFixed(1),
      passed,
      questionResults,
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!quiz || !results) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">No results available!</p>
          <button
            onClick={() => navigate(`/quiz/${id}`)}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
          >
            Take Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Results Summary */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {quiz.title} - Results
          </h1>
          <div
            className={`inline-block px-6 py-3 rounded-lg text-lg font-semibold ${
              results.passed
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {results.passed ? "✓ Passed" : "✗ Failed"}
          </div>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold">{results.correctCount}</div>
              <div className="text-sm opacity-90">Correct</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {results.wrongCount || 0}
              </div>
              <div className="text-sm opacity-90">Wrong</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{results.percentage}%</div>
              <div className="text-sm opacity-90">Score</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm opacity-90">
              Points: {results.earnedPoints} / {results.totalPoints}
            </p>
            <p className="text-sm opacity-90 mt-1">
              Pass Mark: {quiz.passMark}%
            </p>
          </div>
        </div>

        {/* Time Information */}
        {(submissionTime || timeTakenMinutes !== null) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-8 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submissionTime && (
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Submitted At</p>
                    <p className="text-sm font-semibold text-gray-900">{submissionTime}</p>
                  </div>
                </div>
              )}
              {timeTakenMinutes !== null && (
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Time Taken</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {timeTakenMinutes < 1 
                        ? `${timeTakenSeconds} second${timeTakenSeconds !== 1 ? 's' : ''}` 
                        : timeTakenMinutes % 1 === 0
                        ? `${Math.floor(timeTakenMinutes)} minute${Math.floor(timeTakenMinutes) !== 1 ? 's' : ''}`
                        : `${timeTakenMinutes.toFixed(1)} minutes`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Question-by-Question Results */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Question Review
          </h2>
          {results.questionResults.map((result, qIndex) => (
            <div
              key={qIndex}
              className={`border-2 rounded-lg p-6 ${
                result.isCorrect
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Question {qIndex + 1}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    !result.isAnswered
                      ? "bg-yellow-200 text-yellow-800"
                      : result.isCorrect
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {!result.isAnswered ? "○ Not Answered" : result.isCorrect ? "✓ Correct" : "✗ Wrong"}
                </span>
              </div>

              <p className="text-gray-700 mb-4">{result.question.questionText}</p>

              <div className="space-y-2 mb-4">
                <div>
                  <span className="font-semibold text-gray-700">Your Answer: </span>
                  <span className="text-gray-600">
                    {!result.isAnswered
                      ? "Not answered"
                      : result.question.questionType === "short-answer"
                      ? result.userAnswer || "No answer provided"
                      : result.question.options[result.userAnswer]?.text ||
                        "No answer selected"}
                  </span>
                </div>
                {(!result.isCorrect || !result.isAnswered) && (
                  <div>
                    <span className="font-semibold text-green-700">
                      Correct Answer:{" "}
                    </span>
                    <span className="text-green-600">
                      {result.correctAnswerText}
                    </span>
                  </div>
                )}
              </div>

              {result.question.explanation && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-2">
                    Explanation:
                  </p>
                  <p className="text-blue-800">{result.question.explanation}</p>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-500">
                Points: {result.isCorrect ? result.question.points : 0} /{" "}
                {result.question.points}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate(`/course/${quiz.courseId._id || quiz.courseId}`)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Back to Course
          </button>
          {quiz.allowRetakes && (
            <button
              onClick={() => navigate(`/quiz/${id}`)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Retake Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizResults;

