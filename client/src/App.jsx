import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import QuizTaking from "./pages/QuizTaking";
import QuizResults from "./pages/QuizResults";
import Footer from "./components/Footer";
import RegisterModal from "./components/RegisterModal";
import SignInModal from "./components/SignInModal";
import ProtectedRoute from "./components/ProtectedRoute";
import { ModalProvider, useModal } from "./context/ModalContext";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

function AppContent() {
  const {
    isRegisterModalOpen,
    closeRegisterModal,
    isSignInModalOpen,
    closeSignInModal,
  } = useModal();

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <Courses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/course/:id"
              element={
                <ProtectedRoute>
                  <CourseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:id"
              element={
                <ProtectedRoute>
                  <QuizTaking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:id/results"
              element={
                <ProtectedRoute>
                  <QuizResults />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={closeRegisterModal}
      />
      <SignInModal isOpen={isSignInModalOpen} onClose={closeSignInModal} />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <Router>
          <AppContent />
        </Router>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
