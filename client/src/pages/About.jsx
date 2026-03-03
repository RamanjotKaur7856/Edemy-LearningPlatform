import React from "react";

const About = () => {
  const stats = [
    { number: "10,000+", label: "Students Enrolled" },
    { number: "500+", label: "Expert Instructors" },
    { number: "95%", label: "Success Rate" },
    { number: "24/7", label: "Support Available" },
  ];

  const values = [
    {
      title: "Quality Education",
      description:
        "We provide high-quality, industry-relevant courses designed by experts.",
    },
    {
      title: "Flexible Learning",
      description:
        "Learn at your own pace with our flexible course schedules and formats.",
    },
    {
      title: "Community Support",
      description:
        "Join a vibrant community of learners and get support from peers and mentors.",
    },
    {
      title: "Career Growth",
      description:
        "Our courses are designed to help you advance your career and achieve your goals.",
    },
  ];

  return (
    <div>
      <section className="gradient-bg py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About Edemy
          </h1>
          <p className="text-xl text-gray-600">
            We are passionate about making quality education accessible to
            everyone, everywhere. Our mission is to empower learners with the
            skills they need to succeed in today's rapidly changing world.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                To democratize education by providing high-quality, accessible
                learning experiences that empower individuals to achieve their
                personal and professional goals.
              </p>
              <p className="text-gray-600 mb-4">
                We believe that education should be accessible to everyone,
                regardless of their background or circumstances. That's why
                we've created a platform that offers flexible, affordable, and
                high-quality courses taught by industry experts.
              </p>
              <p className="text-gray-600">
                Our courses are designed to be practical, engaging, and relevant
                to today's job market, ensuring that our students gain the
                skills they need to succeed.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Join Our Community</h3>
              <p className="text-lg mb-4">
                Become part of a global community of learners who are
                transforming their lives through education.
              </p>
              <p>
                With over 10,000 students and counting, we're building a future
                where quality education is accessible to all.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Our Impact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
