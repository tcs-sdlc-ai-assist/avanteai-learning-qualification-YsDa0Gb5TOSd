import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProgramsPage from './pages/ProgramsPage';
import PoliciesPage from './pages/PoliciesPage';
import UploadPage from './pages/UploadPage';
import ExceptionQueuePage from './pages/ExceptionQueuePage';
import ExportCenterPage from './pages/ExportCenterPage';
import AuditLogPage from './pages/AuditLogPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated routes with Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />

                <Route
                  path="/programs"
                  element={
                    <ProtectedRoute requiredRoles={['Admin', 'LearningManager']}>
                      <ProgramsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/policies"
                  element={
                    <ProtectedRoute requiredRoles={['Admin', 'LearningManager']}>
                      <PoliciesPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/upload"
                  element={
                    <ProtectedRoute requiredRoles={['Admin', 'LearningManager']}>
                      <UploadPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/exceptions"
                  element={
                    <ProtectedRoute requiredRoles={['Admin', 'Reviewer']}>
                      <ExceptionQueuePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/export"
                  element={
                    <ProtectedRoute requiredRoles={['Admin', 'SharedServices', 'Auditor']}>
                      <ExportCenterPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/audit-log"
                  element={
                    <ProtectedRoute requiredRoles={['Admin', 'Auditor']}>
                      <AuditLogPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;