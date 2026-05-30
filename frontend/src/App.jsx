import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute  from "./components/common/ProtectedRoute.jsx";

import LandingPage              from "./pages/LandingPage.jsx";
import LoginPage               from "./pages/LoginPage.jsx";
import RegisterPage            from "./pages/RegisterPage.jsx";
import Dashboard               from "./pages/Dashboard.jsx";
import UploadResume            from "./pages/UploadResume.jsx";
import AnalysisReport          from "./pages/AnalysisReport.jsx";
import MockInterview           from "./pages/MockInterview.jsx";
import Results                 from "./pages/Results.jsx";
import AdvancedPage            from "./pages/AdvancedPage.jsx";
import FollowUpPage            from "./pages/FollowUpPage.jsx";
import ConfidencePage          from "./pages/ConfidencePage.jsx";
import CompareResumesPage      from "./pages/CompareResumesPage.jsx";
import RejectionSimulatorPage  from "./pages/RejectionSimulatorPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/"          element={<LandingPage />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/register"  element={<RegisterPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard"              element={<Dashboard />} />
          <Route path="/resume/upload"          element={<UploadResume />} />
          <Route path="/resume/analysis/:id"    element={<AnalysisReport />} />
          <Route path="/interview/start"        element={<MockInterview />} />
          <Route path="/interview/results/:id"  element={<Results />} />

          {/* ── Step 14: Advanced tools ─────────────────────────────── */}
          <Route path="/advanced"              element={<AdvancedPage />} />
          <Route path="/advanced/followup"     element={<FollowUpPage />} />
          <Route path="/advanced/confidence"   element={<ConfidencePage />} />
          <Route path="/advanced/compare"      element={<CompareResumesPage />} />
          <Route path="/advanced/rejection"    element={<RejectionSimulatorPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}