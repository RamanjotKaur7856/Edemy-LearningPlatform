import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import { createSocketConnection } from "../utils/socketConfig";

const QuizTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const submitOnTimeoutRef = useRef(false);
  const startTimeRef = useRef(null);
  const socketRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const handleSubmitRef = useRef(null);
  const quizRef = useRef(null);
  const answersRef = useRef({});
  const timeLeftRef = useRef(null);
  const navigateRef = useRef(null);
  const submittingRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  // Keep refs updated with latest values
  useEffect(() => {
    quizRef.current = quiz;
    answersRef.current = answers;
    timeLeftRef.current = timeLeft;
    navigateRef.current = navigate;
  }, [quiz, answers, timeLeft, navigate]);

  // Keep submitting ref updated
  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  // WebSocket connection and quiz room management
  useEffect(() => {
    if (!quiz || !id) return;

    // Initialize WebSocket connection
    const socket = createSocketConnection();

    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      
      // Join quiz room when connected
      socket.emit("join_quiz", id);
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setIsConnected(false);
    });

    // Quiz timer events
    socket.on("timer_update", (data) => {
      if (data.timeLeft !== undefined) {
        setTimeLeft(data.timeLeft);
        timeLeftRef.current = data.timeLeft;
        
        // Backup check: if timer reaches 0 and we haven't submitted, trigger auto-submit
        if (data.timeLeft <= 0 && !submittingRef.current && !submitOnTimeoutRef.current) {
          console.log("Timer reached 0, triggering backup auto-submit");
          submitOnTimeoutRef.current = true;
          
          // Use the same auto-submit logic
          const currentQuiz = quizRef.current;
          const currentAnswers = answersRef.current;
          const currentNavigate = navigateRef.current;
          
          if (currentQuiz && currentNavigate) {
            setSubmitting(true);
            setShowConfirmDialog(false);
            
            setTimeout(() => {
              const endTime = new Date();
              const startTime = startTimeRef.current || endTime;
              const timeTakenMs = endTime - startTime;
              const timeTakenMinutes = Math.round((timeTakenMs / 1000 / 60) * 10) / 10;
              const timeTakenSeconds = Math.floor(timeTakenMs / 1000);
              const submissionTime = endTime.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              });

              currentNavigate(`/quiz/${id}/results`, {
                state: { 
                  quiz: currentQuiz, 
                  answers: currentAnswers,
                  timeTakenSeconds: timeTakenSeconds,
                  timeTakenMinutes: timeTakenMinutes,
                  submissionTime: submissionTime,
                },
              });
            }, 500);
          }
        }
      }
    });

    socket.on("quiz_started", (data) => {
      console.log("Quiz started via WebSocket", data);
      if (data.startTime) {
        startTimeRef.current = new Date(data.startTime);
      }
    });

    socket.on("auto_submit", (data) => {
      console.log("Auto-submit triggered:", data.message);
      submitOnTimeoutRef.current = true;
      
      // Force submission - use refs to get latest values
      const performAutoSubmit = () => {
        // Get latest values from refs
        const currentQuiz = quizRef.current;
        const currentAnswers = answersRef.current;
        const currentNavigate = navigateRef.current;
        
        if (!currentQuiz) {
          console.error("Quiz not available for auto-submit");
          return;
        }

        setSubmitting(true);
        setShowConfirmDialog(false);
        
        // Small delay to show submitting state
        setTimeout(() => {
          const endTime = new Date();
          const startTime = startTimeRef.current || endTime;
          const timeTakenMs = endTime - startTime;
          const timeTakenMinutes = Math.round((timeTakenMs / 1000 / 60) * 10) / 10;
          const timeTakenSeconds = Math.floor(timeTakenMs / 1000);
          const submissionTime = endTime.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });

          if (currentNavigate) {
            currentNavigate(`/quiz/${id}/results`, {
              state: { 
                quiz: currentQuiz, 
                answers: currentAnswers,
                timeTakenSeconds: timeTakenSeconds,
                timeTakenMinutes: timeTakenMinutes,
                submissionTime: submissionTime,
              },
            });
          }
        }, 500);
      };

      // Try using handleSubmit ref first, otherwise use direct submission
      if (handleSubmitRef.current) {
        try {
          handleSubmitRef.current(true);
        } catch (error) {
          console.error("Error calling handleSubmit for auto-submit:", error);
          performAutoSubmit();
        }
      } else {
        console.warn("handleSubmit ref not available, using direct submission");
        performAutoSubmit();
      }
    });

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socket.emit("leave_quiz", id);
        socket.disconnect();
        socketRef.current = null;
      }
      // Clean up fallback timer if exists
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [quiz, id]);

  const handleSubmit = useCallback(async (confirmed = false) => {
    // Allow auto-submit even if started is false or submitting is true
    const isAutoSubmit = submitOnTimeoutRef.current || confirmed;
    if (!isAutoSubmit && (!started || submitting)) return;

    // Show confirmation dialog if not already confirmed
    if (!confirmed && !submitOnTimeoutRef.current) {
      const answeredCount = Object.keys(answers).length;
      const unansweredCount = (quiz?.questions?.length || quiz?.totalQuestions || 0) - answeredCount;
      
      if (unansweredCount > 0) {
        setShowConfirmDialog(true);
        return;
      }
    }

    setSubmitting(true);
    setShowConfirmDialog(false);

    // Small delay to show submitting state
    await new Promise(resolve => setTimeout(resolve, 500));

    // Calculate time taken
    const endTime = new Date();
    const startTime = startTimeRef.current || endTime;
    const timeTakenMs = endTime - startTime;
    const timeTakenMinutes = Math.round((timeTakenMs / 1000 / 60) * 10) / 10; // Round to 1 decimal place
    const timeTakenSeconds = Math.floor(timeTakenMs / 1000);
    const submissionTime = endTime.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    // Prepare answers for submission
    const submission = {
      quizId: quiz._id,
      answers: answers,
      timeSpent: quiz.timeLimit * 60 - timeLeft,
      timeTakenSeconds: timeTakenSeconds,
      timeTakenMinutes: timeTakenMinutes,
      submissionTime: submissionTime,
    };

    // Navigate to results page with answers
    navigate(`/quiz/${id}/results`, {
      state: { 
        quiz, 
        answers: submission.answers,
        timeTakenSeconds: submission.timeTakenSeconds,
        timeTakenMinutes: submission.timeTakenMinutes,
        submissionTime: submission.submissionTime,
      },
    });
  }, [started, submitting, answers, quiz, timeLeft, navigate, id]);

  // Keep handleSubmit ref updated
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Remove client-side timer - server now controls the timer via WebSocket
  // Timer updates are received via WebSocket 'timer_update' event

  const fetchQuiz = async () => {
    try {
      const response = await api.get(`/quizzes/${id}`);
      const quizData = response.data;
      console.log(`QuizTaking: Fetched quiz with ${quizData.questions?.length || 0} questions (totalQuestions: ${quizData.totalQuestions})`);
      setQuiz(quizData);
      setTimeLeft(quizData.timeLimit * 60); // Convert minutes to seconds
    } catch (error) {
      console.error("Error fetching quiz:", error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    if (socketRef.current && socketRef.current.connected) {
      // Emit start_quiz event to server
      socketRef.current.emit("start_quiz", id);
      setStarted(true);
    } else {
      // Fallback if WebSocket is not connected
      console.warn("WebSocket not connected, using fallback timer");
      setStarted(true);
      startTimeRef.current = new Date();
      // Fallback client-side timer (less secure, but works if WebSocket fails)
      // Clear any existing fallback timer
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
      }
      fallbackTimerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (fallbackTimerRef.current) {
              clearInterval(fallbackTimerRef.current);
              fallbackTimerRef.current = null;
            }
            submitOnTimeoutRef.current = true;
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: value,
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).filter(key => {
      const answer = answers[key];
      return answer !== undefined && answer !== null && answer !== "";
    }).length;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">Quiz not found!</p>
        </div>
      </div>
    );
  }

  // Use actual questions array length, fallback to totalQuestions
  const totalQuestions = quiz.questions?.length || quiz.totalQuestions || 0;

  if (!started) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{quiz.title}</h1>
          {quiz.subtitle && (
            <p className="text-xl text-gray-600 mb-4">{quiz.subtitle}</p>
          )}
          <p className="text-gray-700 mb-6">{quiz.description}</p>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quiz Instructions
            </h2>
            <p className="text-gray-700 mb-4">{quiz.instructions}</p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center">
                <span className="font-medium mr-2">•</span>
                <span>Total Questions: {totalQuestions}</span>
              </li>
              <li className="flex items-center">
                <span className="font-medium mr-2">•</span>
                <span>Time Limit: {quiz.timeLimit} minutes</span>
              </li>
              <li className="flex items-center">
                <span className="font-medium mr-2">•</span>
                <span>Pass Mark: {quiz.passMark}%</span>
              </li>
              <li className="flex items-center">
                <span className="font-medium mr-2">•</span>
                <span>Total Points: {quiz.totalPoints}</span>
              </li>
            </ul>
          </div>

          <button
            onClick={startQuiz}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Timer and Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-sm text-gray-600">
                Progress: {getAnsweredCount()} / {totalQuestions} answered
              </p>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(getAnsweredCount() / (totalQuestions || 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-2xl font-bold ${
                timeLeft < 60 ? "text-red-600" : "text-gray-900"
              }`}
            >
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </div>
            <p className="text-xs text-gray-500">
              Time Remaining
              {isConnected ? (
                <span className="ml-2 text-green-600">●</span>
              ) : (
                <span className="ml-2 text-red-600">●</span>
              )}
            </p>
          </div>
        </div>

        {/* Questions */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}>
          <div className="space-y-8">
            {quiz.questions.map((question, qIndex) => {
              const isAnswered = answers[qIndex] !== undefined && answers[qIndex] !== null && answers[qIndex] !== "";
              return (
              <div key={qIndex} className={`border-b pb-6 last:border-b-0 ${isAnswered ? 'rounded-lg p-4' : ''}`}>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Question {qIndex + 1}
                    </h3>
                    {isAnswered && (
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                        ✓ Answered
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-4">{question.questionText}</p>
                  <p className="text-sm text-gray-500">
                    Points: {question.points}
                  </p>
                </div>

                {question.questionType === "short-answer" ? (
                  <div>
                    <textarea
                      value={answers[qIndex] || ""}
                      onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows="4"
                      placeholder="Type your answer here..."
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {question.options.map((option, oIndex) => (
                      <label
                        key={oIndex}
                        className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`question_${qIndex}`}
                          value={oIndex}
                          checked={answers[qIndex] === oIndex}
                          onChange={() => handleAnswerChange(qIndex, oIndex)}
                          className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-gray-700">{option.text}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
            })}
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                "Submit Quiz"
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Submission Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Confirm Submission
              </h3>
              <p className="text-gray-700 mb-4">
                You have answered {getAnsweredCount()} out of {totalQuestions} questions.
              </p>
              <p className="text-gray-600 mb-6">
                {totalQuestions - getAnsweredCount()} question(s) remain unanswered. Are you sure you want to submit the quiz?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSubmit(true)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Yes, Submit
                </button>
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Continue Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submitting Overlay */}
        {submitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Submitting Quiz...
              </h3>
              <p className="text-gray-600">
                Please wait while we process your answers
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizTaking;

