import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import VideoModal from "../components/VideoModal";
import { useAuth } from "../context/AuthContext";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [enrollmentModal, setEnrollmentModal] = useState(false);
  const [enrollmentForm, setEnrollmentForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [enrolling, setEnrolling] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [videoModal, setVideoModal] = useState({
    isOpen: false,
    videoId: "",
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchCourse();
    fetchQuizzes();
    checkEnrollmentStatus();
  }, [id, user]);

  const checkEnrollmentStatus = async () => {
    // If user is not logged in, they are not enrolled
    if (!user?.id) {
      setIsEnrolled(false);
      setCheckingEnrollment(false);
      return;
    }
    try {
      const response = await api.get(`/courses/${id}/enrollment/${user.id}`);
      setIsEnrolled(response.data.isEnrolled);
    } catch (error) {
      console.error("Error checking enrollment:", error);
      setIsEnrolled(false);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  const fetchCourse = async () => {
    try {
      console.log("Fetching course with ID:", id);
      const response = await api.get(`/courses/${id}`);
      console.log("Course data received:", response.data);
      setCourse(response.data);
    } catch (error) {
      console.error("Error fetching course:", error);

      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await api.get(`/quizzes/course/${id}`);
      setQuizzes(response.data.filter(quiz => quiz.isPublished));
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setQuizzes([]);
    }
  };

  const toggleSection = (sectionIndex) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  const openVideoModal = (videoId, title, description) => {
    setVideoModal({
      isOpen: true,
      videoId,
      title,
      description,
    });
  };

  const closeVideoModal = () => {
    setVideoModal({
      isOpen: false,
      videoId: "",
      title: "",
      description: "",
    });
  };

  const openEnrollmentModal = () => {
    // Pre-fill form if user is logged in
    if (user) {
      setEnrollmentForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: "",
      });
    } else {
      // Reset form for guest users
      setEnrollmentForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      });
    }
    setEnrollmentModal(true);
  };

  const closeEnrollmentModal = () => {
    setEnrollmentModal(false);
    setEnrollmentForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });
  };

  const handleEnrollmentSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!enrollmentForm.firstName.trim() || !enrollmentForm.lastName.trim()) {
      alert("Please enter your first name and last name.");
      return;
    }
    
    if (!user && !enrollmentForm.email.trim()) {
      alert("Please enter your email address.");
      return;
    }

    setEnrolling(true);

    try {
      const response = await api.post(`/courses/${id}/enroll`, {
        userId: user?.id || null, // If user is logged in, send userId
        firstName: enrollmentForm.firstName.trim(),
        lastName: enrollmentForm.lastName.trim(),
        email: user?.email || enrollmentForm.email.trim(), // Use logged-in user's email if available
        phone: enrollmentForm.phone.trim() || undefined,
      });

      // Update enrollment status
      setIsEnrolled(true);
      closeEnrollmentModal();

      // Update course student count locally
      if (course) {
        setCourse({
          ...course,
          studentCount: (course.studentCount || 0) + 1,
        });
      }

      // If new user was created, update auth context
      if (response.data.user && !user) {
        // You might want to update the auth context here
        // For now, we'll just show success
      }

      alert("Enrollment successful! You now have access to all course content.");
    } catch (error) {
      console.error("Enrollment error:", error);
      alert(
        error.response?.data?.message ||
          "Failed to enroll. Please try again."
      );
    } finally {
      setEnrolling(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400" : "text-gray-300"
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Course not found!</strong>
            <p className="mt-2">
              The course with ID "{id}" could not be found.
            </p>
            <p className="mt-1">Please check the URL or try again later.</p>
          </div>
          <a
            href="/courses"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Browse All Courses
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="gradient-bg py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {course.title}
              </h1>
              <p className="text-xl text-gray-600 mb-4">{course.subtitle}</p>
              <p className="text-gray-600 mb-6">{course.description}</p>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  {renderStars(course.rating)}
                  <span className="text-sm text-gray-600 ml-2">
                    ({course.reviewCount} ratings) {course.studentCount}{" "}
                    students
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden sticky top-8">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-red-600 font-semibold">
                      5 days left at this price!
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      ${course.price}
                    </span>
                    <span className="text-lg text-gray-500 line-through">
                      ${course.originalPrice}
                    </span>
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      20% off
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {course.rating} ★
                        </div>
                        <div className="text-sm text-gray-600">Rating</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {course.duration}
                        </div>
                        <div className="text-sm text-gray-600">Duration</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {course.syllabus?.reduce((total, section) => total + (section.lectures?.length || 0), 0) || course.lessons || 0} lessons
                        </div>
                        <div className="text-sm text-gray-600">Lessons</div>
                      </div>
                    </div>
                  </div>

                  {isEnrolled ? (
                    <div className="bg-green-100 border-2 border-green-400 text-green-800 px-4 py-4 rounded-lg text-center">
                      <svg
                        className="w-8 h-8 mx-auto mb-2 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="font-bold text-lg">Enrolled</p>
                      <p className="text-sm mt-1">Full access granted</p>
                    </div>
                  ) : (
                    <button
                      onClick={openEnrollmentModal}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Enroll Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                  Course Structure
                </h2>
                {course.syllabus?.map((section, index) => (
                  <div key={index} className="mb-4">
                    <button
                      onClick={() => toggleSection(index)}
                      className="w-full text-left bg-gray-50 rounded-lg p-4 flex justify-between items-center hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {section.section}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {section.lectures.length} lectures -{" "}
                          {section.lectures.reduce((total, lecture) => {
                            const hours = parseFloat(lecture.duration);
                            return total + hours;
                          }, 0)}{" "}
                          hours
                        </p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                          expandedSections[index] ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {expandedSections[index] && (
                      <div className="mt-2 bg-white border border-gray-200 rounded-lg p-4">
                        <ul className="space-y-2">
                          {section.lectures.map((lecture, lectureIndex) => (
                            <li
                              key={lectureIndex}
                              className="flex items-center justify-between py-2"
                            >
                              {isEnrolled ? (
                                <button
                                  onClick={() =>
                                    lecture.videoId &&
                                    openVideoModal(
                                      lecture.videoId,
                                      lecture.title,
                                      lecture.description
                                    )
                                  }
                                  className={`flex items-center flex-1 text-left hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200 ${
                                    lecture.videoId
                                      ? "cursor-pointer"
                                      : "cursor-default"
                                  }`}
                                  disabled={!lecture.videoId}
                                >
                                  <svg
                                    className="w-4 h-4 text-blue-600 mr-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <div className="flex-1">
                                    <span
                                      className={`text-gray-900 ${
                                        lecture.videoId
                                          ? "hover:text-blue-600"
                                          : ""
                                      }`}
                                    >
                                      {lecture.title}
                                    </span>
                                    {lecture.videoId && (
                                      <div className="flex items-center mt-1">
                                        <svg
                                          className="w-3 h-3 text-red-500 mr-1"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        <span className="text-xs text-red-500 font-medium">
                                          Watch Video
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </button>
                              ) : (
                                <div className="flex items-center flex-1 text-left p-2 rounded-lg bg-gray-50 opacity-60">
                                  <svg
                                    className="w-4 h-4 text-gray-400 mr-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <div className="flex-1">
                                    <span className="text-gray-500">
                                      {lecture.title}
                                    </span>
                                    <div className="flex items-center mt-1">
                                      <span className="text-xs text-gray-400 font-medium">
                                        Enroll to unlock
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <span className="text-sm text-gray-600 ml-4">
                                {lecture.duration}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  Course Description
                </h2>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {course.subtitle}
                </h3>
                <p className="text-gray-600 mb-4">{course.description}</p>
                <p className="text-gray-600">
                  By the end of this course, you will understand cloud services,
                  deployment models, and best practices for using cloud
                  resources efficiently.
                </p>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                  What you'll learn
                </h2>
                <ul className="space-y-3">
                  {course.learningOutcomes?.map((outcome, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                  Requirements
                </h2>
                <ul className="space-y-3">
                  {course.requirements?.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-blue-500 mr-3 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {isEnrolled && quizzes.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                    Course Quizzes
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quizzes.map((quiz) => (
                      <div
                        key={quiz._id}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                      >
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {quiz.title}
                        </h3>
                        {quiz.subtitle && (
                          <p className="text-sm text-gray-600 mb-3">
                            {quiz.subtitle}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                          <span>{quiz.questions?.length || quiz.totalQuestions || 0} Questions</span>
                          <span>•</span>
                          <span>{quiz.timeLimit} min</span>
                          <span>•</span>
                          <span>{quiz.passMark}% to pass</span>
                        </div>
                        <button
                          onClick={() => navigate(`/quiz/${quiz._id}`)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                          Play Quiz
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!isEnrolled && quizzes.length > 0 && (
                <div className="mb-12">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Quizzes Locked
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Enroll in this course to access quizzes and test your knowledge.
                    </p>
                    <button
                      onClick={openEnrollmentModal}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  What's in the course?
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Lifetime access with free updates.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Step-by-step, hands-on project guidance.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Downloadable resources and source code.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Quizzes to test your knowledge.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Certificate of completion.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <VideoModal
        isOpen={videoModal.isOpen}
        onClose={closeVideoModal}
        videoId={videoModal.videoId}
        title={videoModal.title}
        description={videoModal.description}
      />

      {/* Enrollment Modal */}
      {enrollmentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Enroll in Course
                </h3>
                <button
                  onClick={closeEnrollmentModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <form onSubmit={handleEnrollmentSubmit}>
                {user && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Enrolling as:</strong> {user.firstName} {user.lastName} ({user.email})
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      The course will be added to your account.
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={enrollmentForm.firstName}
                    onChange={(e) =>
                      setEnrollmentForm({
                        ...enrollmentForm,
                        firstName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your first name"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={enrollmentForm.lastName}
                    onChange={(e) =>
                      setEnrollmentForm({
                        ...enrollmentForm,
                        lastName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your last name"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email {!user && "*"}
                  </label>
                  <input
                    type="email"
                    required={!user}
                    value={enrollmentForm.email}
                    onChange={(e) =>
                      setEnrollmentForm({
                        ...enrollmentForm,
                        email: e.target.value,
                      })
                    }
                    disabled={!!user}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      user ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                    placeholder={user ? user.email : "your@email.com"}
                  />
                  {user && (
                    <p className="text-xs text-gray-500 mt-1">
                      Your account email will be used for enrollment.
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={enrollmentForm.phone}
                    onChange={(e) =>
                      setEnrollmentForm({
                        ...enrollmentForm,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEnrollmentModal}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={enrolling}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={enrolling}
                  >
                    {enrolling ? "Enrolling..." : "Enroll Now"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
