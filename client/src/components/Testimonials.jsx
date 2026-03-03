import React from "react";

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Software Engineer",
      company: "Google",
      image:
        "https://www.shutterstock.com/image-photo/indoor-photo-european-man-30-260nw-2608391223.jpg",
      content:
        "The Python course completely transformed my career. The instructors were amazing and the hands-on projects gave me real-world experience. I landed my dream job at Google within 3 months!",
      rating: 5,
      course: "Advanced Python Programming",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Full-Stack Developer",
      company: "Microsoft",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      content:
        "The Web Development Bootcamp was exactly what I needed to transition into tech. The curriculum was comprehensive and the community support was incredible. Highly recommended!",
      rating: 5,
      course: "Web Development Bootcamp",
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      role: "Data Scientist",
      company: "Amazon",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      content:
        "As someone with no technical background, I was nervous about learning data science. But the instructors made everything so clear and accessible. Now I'm working as a Data Scientist at Amazon!",
      rating: 5,
      course: "Data Science with Python",
    },
    {
      id: 4,
      name: "David Kim",
      role: "Cybersecurity Analyst",
      company: "IBM",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      content:
        "The cybersecurity course gave me the skills and confidence to protect organizations from threats. The practical labs and real-world scenarios were invaluable. Best investment I've made!",
      rating: 5,
      course: "Cybersecurity Basics",
    },
    {
      id: 5,
      name: "Lisa Thompson",
      role: "Frontend Developer",
      company: "Netflix",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      content:
        "The JavaScript course was a game-changer for me. The interactive learning approach and the supportive community helped me master the fundamentals quickly. Now I'm building amazing user experiences!",
      rating: 5,
      course: "Introduction to JavaScript",
    },
    {
      id: 6,
      name: "James Wilson",
      role: "Cloud Solutions Architect",
      company: "AWS",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      content:
        "The cloud computing course opened up so many opportunities for me. The instructors were industry experts and the hands-on labs were fantastic. I'm now designing cloud solutions for major enterprises!",
      rating: 5,
      course: "Cloud Computing Essentials",
    },
  ];

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
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Testimonials
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Hear from our learners as they share their journeys of
            transformation, success, and how our platform has made a difference
            in their lives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-sm text-blue-600 font-medium">
                    {testimonial.company}
                  </p>
                </div>
              </div>

              <div className="flex items-center mb-3">
                <div className="flex items-center">
                  {renderStars(testimonial.rating)}
                </div>
                <span className="text-sm text-gray-500 ml-2">5.0</span>
              </div>

              <blockquote className="text-gray-700 mb-4 italic">
                "{testimonial.content}"
              </blockquote>

              <div className="text-sm text-gray-500">
                <span className="font-medium">Course:</span>{" "}
                {testimonial.course}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
