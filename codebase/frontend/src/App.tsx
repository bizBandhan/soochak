/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Router & Application Root
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { industryLandingPages } from './pages/IndustryLandingPages';
import { SeoManager } from './seo/SeoManager';

const AppLayout = lazy(() =>
  import('./components/layout/AppLayout').then(({ AppLayout }) => ({ default: AppLayout })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then(({ LoginPage }) => ({ default: LoginPage })),
);
const RegisterOrgPage = lazy(() =>
  import('./pages/RegisterOrgPage').then(({ RegisterOrgPage }) => ({ default: RegisterOrgPage })),
);
const DashboardOverviewPage = lazy(() =>
  import('./pages/DashboardOverviewPage').then(({ DashboardOverviewPage }) => ({ default: DashboardOverviewPage })),
);
const NotificationsPage = lazy(() =>
  import('./pages/NotificationsPage').then(({ NotificationsPage }) => ({ default: NotificationsPage })),
);
const ComposeNotificationPage = lazy(() =>
  import('./pages/ComposeNotificationPage').then(({ ComposeNotificationPage }) => ({ default: ComposeNotificationPage })),
);
const SitesResourcesPage = lazy(() =>
  import('./pages/SitesResourcesPage').then(({ SitesResourcesPage }) => ({ default: SitesResourcesPage })),
);
const SubscribersPage = lazy(() =>
  import('./pages/SubscribersPage').then(({ SubscribersPage }) => ({ default: SubscribersPage })),
);
const PushConfigPage = lazy(() =>
  import('./pages/PushConfigPage').then(({ PushConfigPage }) => ({ default: PushConfigPage })),
);
const UsersRolesPermissionsPage = lazy(() =>
  import('./pages/UsersRolesPermissionsPage').then(({ UsersRolesPermissionsPage }) => ({ default: UsersRolesPermissionsPage })),
);
const OrgSettingsPage = lazy(() =>
  import('./pages/OrgSettingsPage').then(({ OrgSettingsPage }) => ({ default: OrgSettingsPage })),
);
const ProfileSecurityPage = lazy(() =>
  import('./pages/ProfileSecurityPage').then(({ ProfileSecurityPage }) => ({ default: ProfileSecurityPage })),
);
const CoachingLandingPage = lazy(() =>
  import('./pages/CoachingLandingPage').then(({ CoachingLandingPage }) => ({ default: CoachingLandingPage })),
);
const CreatorsLandingPage = lazy(() =>
  import('./pages/CreatorsLandingPage').then(({ CreatorsLandingPage }) => ({ default: CreatorsLandingPage })),
);
const IndustryLandingPage = lazy(() =>
  import('./components/marketing/IndustryLandingPage').then(({ IndustryLandingPage }) => ({ default: IndustryLandingPage })),
);

const SessionLoading: React.FC = () => (
  <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-400">
    <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-3" />
    <span className="text-xs font-mono">Initializing Soochak session...</span>
  </div>
);

const PageLoading: React.FC = () => (
  <div role="status" className="min-h-screen bg-slate-950 p-6 text-center text-slate-300">
    Loading page...
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <SessionLoading />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const HomeOrDashboard: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <SessionLoading />;
  return isAuthenticated ? <AppLayout /> : <HomePage />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SeoManager />
        <Suspense fallback={<PageLoading />}>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterOrgPage />} />
            <Route path="/landing/coaching" element={<CoachingLandingPage />} />
            <Route path="/landing/creators" element={<CreatorsLandingPage />} />
            {industryLandingPages.map((config) => (
              <Route key={config.vertical} path={`/landing/${config.vertical}`} element={<IndustryLandingPage config={config} />} />
            ))}

            <Route path="/" element={<HomeOrDashboard />}>
              <Route index element={<DashboardOverviewPage />} />
            </Route>

            {/* Authenticated Dashboard Shell */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
