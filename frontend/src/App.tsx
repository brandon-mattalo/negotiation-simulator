import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { SessionProvider } from './contexts/SessionContext';
import { AssignmentProvider } from './contexts/AssignmentContext';
import { ToastProvider } from './components/ui';
import { ProtectedRoute } from './components/Layout/ProtectedRoute';
import { LoginForm } from './components/Auth/LoginForm';
import { InstructorDashboard } from './pages/InstructorDashboard';
import { InstructorConfigurations } from './pages/InstructorConfigurations';
import { InstructorConfigurationForm } from './pages/InstructorConfigurationForm';
import { InstructorAssignments } from './pages/InstructorAssignments';
import { InstructorAssignmentForm } from './pages/InstructorAssignmentForm';
import { InstructorReview } from './pages/InstructorReview';
import { InstructorTemplates } from './pages/InstructorTemplates';
import { InstructorStudents } from './pages/InstructorStudents';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentAssignments } from './pages/StudentAssignments';
import { StudentHistory } from './pages/StudentHistory';
import { ChatInterface } from './components/Student/ChatInterface';
import { SessionDetail } from './pages/SessionDetail';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <ConfigProvider>
          <SessionProvider>
            <AssignmentProvider>
              <Router>
              <Routes>
                <Route path="/login" element={<LoginForm />} />

                <Route
                  path="/instructor"
                  element={
                    <ProtectedRoute requiredRole="instructor">
                      <InstructorDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/instructor/configurations"
                  element={
                    <ProtectedRoute requiredRole="instructor">
                      <InstructorConfigurations />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/instructor/configurations/new"
                  element={
                    <ProtectedRoute requiredRole="instructor">
                      <InstructorConfigurationForm />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/instructor/configurations/:id/edit"
                  element={
                    <ProtectedRoute requiredRole="instructor">
                      <InstructorConfigurationForm />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/instructor/assignments"
                  element={
                    <ProtectedRoute requiredRole="instructor">
                      <InstructorAssignments />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/instructor/assignments/new"
                  element={
                    <ProtectedRoute requiredRole="instructor">
                      <InstructorAssignmentForm />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/instructor/review"
                  element={
                    <ProtectedRoute requiredRole="instructor">
                      <InstructorReview />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/instructor/templates"
                  element={
                    <ProtectedRoute requiredRole="instructor">
                      <InstructorTemplates />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/instructor/students"
                  element={
                    <ProtectedRoute requiredRole="instructor">
                      <InstructorStudents />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/instructor/review/:id"
                  element={
                    <ProtectedRoute requiredRole="instructor">
                      <SessionDetail />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/student"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/student/assignments"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentAssignments />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/student/history"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentHistory />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/student/negotiate"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <ChatInterface />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/student/history/:id"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <SessionDetail />
                    </ProtectedRoute>
                  }
                />

                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </Router>
            </AssignmentProvider>
          </SessionProvider>
        </ConfigProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
