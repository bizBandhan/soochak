/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Router & Application Root
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterOrgPage } from './pages/RegisterOrgPage';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ComposeNotificationPage } from './pages/ComposeNotificationPage';
import { SitesResourcesPage } from './pages/SitesResourcesPage';
import { SubscribersPage } from './pages/SubscribersPage';
import { PushConfigPage } from './pages/PushConfigPage';
import { UsersRolesPermissionsPage } from './pages/UsersRolesPermissionsPage';
import { OrgSettingsPage } from './pages/OrgSettingsPage';
import { ProfileSecurityPage } from './pages/ProfileSecurityPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono">Initializing Soochak session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register-org" element={<RegisterOrgPage />} />

          {/* Authenticated Dashboard Shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverviewPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="notifications/compose" element={<ComposeNotificationPage />} />
            <Route path="subscribers" element={<SubscribersPage />} />
            <Route path="sites" element={<SitesResourcesPage />} />
            <Route path="config" element={<PushConfigPage />} />
            <Route path="administration" element={<UsersRolesPermissionsPage />} />
            <Route path="settings" element={<OrgSettingsPage />} />
            <Route path="profile" element={<ProfileSecurityPage />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
