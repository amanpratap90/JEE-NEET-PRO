
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer"
import ScrollToTop from "./components/ScrollToTop";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { useEffect } from "react";
import { checkCacheVersion } from "./utils/apiCache";

import TestSeries from "./pages/TestSeries";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Subjects = lazy(() => import("./pages/Subjects"));
const Chapters = lazy(() => import("./pages/Chapters"));
const Practice = lazy(() => import("./pages/Practice"));
const ResourceList = lazy(() => import("./pages/ResourceList"));
// const TestSeries = lazy(() => import("./pages/TestSeries")); // Switched to direct import
const ExamDashboard = lazy(() => import("./pages/ExamDashboard"));
const MockTestPage = lazy(() => import("./pages/MockTestPage"));

// Loading Component
const Loading = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
    color: 'var(--accent-teal)'
  }}>
    <h2>Loading...</h2>
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const showFooter = location.pathname === '/';

  return (
    <>
      <Navbar />
      <ScrollToTop />
      <main>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes: User must be logged in to access anything under /:exam */}
            <Route element={<ProtectedRoute />}>
              <Route path="/test-series" element={<TestSeries />} />
              <Route path="/:exam" element={<ExamDashboard />} />
              <Route path="/:exam/subjects" element={<Subjects />} />
              <Route path="/:exam/test-series" element={<TestSeries />} />
              <Route path="/:exam/test-series/:testId" element={<MockTestPage />} />
              <Route path="/:exam/notes" element={<ResourceList type="notes" title="Notes" />} />
              <Route path="/:exam/short-notes" element={<ResourceList type="shortNotes" title="Short Notes" />} />
              <Route path="/:exam/books" element={<ResourceList type="books" title="Books" />} />
              <Route path="/:exam/subjects/:subject" element={<Chapters />} />
              <Route path="/:exam/subjects/:subject/:chapter" element={<Practice />} />
            </Route>

            {/* Admin Route */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </Suspense>
      </main>
      {showFooter && <Footer />}
    </>
  );
};

export default function App() {
  useEffect(() => {
    checkCacheVersion();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
