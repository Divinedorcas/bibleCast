import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { GuestRoute } from './components/common/GuestRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { BibleSearch } from './pages/BibleSearch';
import { History } from './pages/History';
import { Queue } from './pages/Queue';
import { Projector } from './pages/Projector';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Guest Only Routes */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />

          {/* Standalone Projector Screen (Stage & Sanctuary Display) */}
          <Route path="/projector" element={<Projector />} />

          {/* Authenticated Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout title="Dashboard">
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Scripture Search */}
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <DashboardLayout title="Scripture Search">
                  <BibleSearch />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/bible-search" element={<Navigate to="/search" replace />} />

          {/* History & Favourites */}
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <DashboardLayout title="History & Favourites">
                  <History />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Service Projection Queue */}
          <Route
            path="/queue"
            element={
              <ProtectedRoute>
                <DashboardLayout title="Service Queue">
                  <Queue />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
