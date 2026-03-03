import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axiosConfig";
import Testimonials from "../components/Testimonials";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

const Home = () => {
  const [courses, setCourses] = useState([]);
  const { isAuthenticated } = useAuth();
  const { openSignInModal, openRegisterModal } = useModal();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get("/courses");
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };
  const companies = [
    {
      name: "Walmart",
      logo: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Walmart_logo_%282008%29.svg",
    },
    {
      name: "Accenture",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Accenture.svg/1200px-Accenture.svg.png",
    },

    {
      name: "Adobe",
      logo: "https://1000logos.net/wp-content/uploads/2021/04/Adobe-logo.png",
    },
    {
      name: "PayPal",
      logo: "https://w7.pngwing.com/pngs/782/863/png-transparent-paypal-logo-paypal-logo-paypal-blue-text-trademark.png",
    },
  ];

  const featuredCourses = courses.slice(0, 4);

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

  return (
    <div>
      <section
        className=" py-16 relative bg-cover bg-center h-[600px]"
        style={{
          backgroundImage: "url('/home-bg.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8  relative z-10">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-6">
            Empower your future with the courses
            <br /> designed to{" "}
            <span className="text-blue-300 relative">
              fit your choice.
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-300 to-blue-200 rounded-full"></div>
            </span>
          </h1>

          <p className="text-lg text-white mb-8  ">
            We bring together world-class instructors, interactive content, and
            a supportive
            <br />
            community to help you achieve your personal and professional goals.
          </p>

          <div className="mt-16">
            <p className="text-sm text-white mb-6">Trusted by learners from</p>
            <div className="flex   space-x-6 flex-wrap gap-4">
              {companies.map((company) => (
                <div
                  key={company.name}
                  className="flex items-center space-x-2 "
                >
                  <img
                    src={company.logo}
                    alt={`${company.name} logo`}
                    className="w-20 object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Learn from the best
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover our top-rated courses across various categories. From
              coding and design to business and wellness, our courses are
              crafted to deliver results.
            </p>
          </div>

          {isAuthenticated() ? (
            <>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredCourses.map((course) => (
                    <Link
                      key={course._id}
                      to={`/course/${course._id}`}
                      className=""
                    >
                      <div
                        key={course._id}
                        className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100 cursor-pointer"
                      >
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-60 object-cover"
                        />
                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {course.title}
                          </h3>

                          <div className="flex items-center mb-3">
                            <div className="flex items-center">
                              {renderStars(course.rating)}
                            </div>
                            <span className="text-sm text-gray-500 ml-2">
                              ({course.reviewCount})
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mb-3">
                            {course.duration} • {course.lessons} lessons
                          </p>

                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {course.category}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                              {course.level}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold text-blue-600">
                                ${course.price}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                ${course.originalPrice}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {featuredCourses.length === 0 && (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No courses found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your search criteria or browse all courses.
                    </p>
                  </div>
                )}
              </div>

              <div className="text-center mt-8">
                <Link to="/courses" className="btn-secondary">
                  Show all courses
                </Link>
              </div>
            </>
          ) : (
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-12">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Unlock Your Learning Potential
                </h3>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Join thousands of learners who are already advancing their
                  careers with our comprehensive courses. Sign in to access our
                  full library of courses and start your learning journey today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={openSignInModal}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Sign In to Access Courses
                  </button>
                  <button
                    onClick={openRegisterModal}
                    className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Create Free Account
                  </button>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      11+
                    </div>
                    <div className="text-sm text-gray-600">Expert Courses</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      50K+
                    </div>
                    <div className="text-sm text-gray-600">
                      Students Enrolled
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      4.9/5
                    </div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Testimonials />
    </div>
  );
};

export default Home;
