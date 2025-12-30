import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login/Login';
import Navbar from './components/Navbar';
import UserManagement from './pages/Admin/UserManagement/UserManagement';
import UploadSelector from "./pages/User/Upload/index";
import UploadResearchPage from "./pages/User/Upload/UploadResearchPage";
import UploadConferencePage from "./pages/User/Upload/UploadConferencePage";
import UploadBookChapterPage from "./pages/User/Upload/UploadBookChapterPage";
import EditSelector from "./pages/User/Edit/index";

import SuperAdminDashboard from './pages/User/SuperAdminDashboard/SuperAdminDashboard';
import CampusAdminDashboard from './pages/User/CampusAdminDashboard/CampusAdminDashboard';
import SettingsPage from './pages/Settings/SettingsPage';
import FacultyDashboard from './pages/User/FacultyDashboard/FacultyDashboard';
import AnalyticsPage from './pages/User/Analytics/AnalyticsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/Toast';
import PWAInstallBanner from './components/PWAInstallBanner';
import SplashScreen from './components/SplashScreen';

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash only on root path and if not shown in this navigation session
    if (window.location.pathname !== '/') {
      return false;
    }
    const splashShown = sessionStorage.getItem('splashShown');
    return !splashShown;
  });

  // Check if user is authenticated and not an admin (for PWA banner)
  const isAuthenticated = !!localStorage.getItem('token');
  const user = isAuthenticated ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const showPWABanner = isAuthenticated && !isLoginPage && user?.role !== 'super_admin';

  useEffect(() => {
    // Mark splash as shown in this session when it displays
    if (showSplash && location.pathname === '/') {
      sessionStorage.setItem('splashShown', 'true');
    }
  }, [showSplash, location.pathname]);

  // Show splash screen on initial load (only on root path)
  if (showSplash && location.pathname === '/') {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <>
      {!isLoginPage && <Navbar />}
      {/* PWA Install Banner - only for authenticated non-admin users */}
      {showPWABanner && <PWAInstallBanner />}
      <Routes>
        {/* Splash screen route */}
        <Route path="/splash" element={<SplashScreen />} />
        
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Super Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
          <Route path="/super-admin/users" element={<UserManagement />} />
          <Route path="/super-admin/analytics" element={<AnalyticsPage />} />
          <Route path="/super-admin/edit/:type/:id" element={<EditSelector />} />
        </Route>

        {/* Campus Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['campus_admin']} />}>
          <Route path="/campus-admin" element={<CampusAdminDashboard />} />
          <Route path="/campus-admin/users" element={<UserManagement />} />
          <Route path="/campus-admin/analytics" element={<AnalyticsPage />} />
          <Route path="/campus-admin/upload" element={<UploadSelector />} />
          <Route path="/campus-admin/upload/research" element={<UploadResearchPage />} />
          <Route path="/campus-admin/upload/conference" element={<UploadConferencePage />} />
          <Route path="/campus-admin/upload/book-chapter" element={<UploadBookChapterPage />} />
          <Route path="/campus-admin/edit/:type/:id" element={<EditSelector />} />
        </Route>


        {/* Faculty routes */}
        <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
          <Route path="/faculty" element={<FacultyDashboard />} />
          <Route path="/faculty/upload" element={<UploadSelector />} />
          <Route path="/faculty/upload/research" element={<UploadResearchPage />} />
          <Route path="/faculty/upload/conference" element={<UploadConferencePage />} />
          <Route path="/faculty/upload/book-chapter" element={<UploadBookChapterPage />} />
          <Route path="/faculty/edit/:type/:id" element={<EditSelector />} />
        </Route>

        {/* Common routes accessible to all authenticated users */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin', 'campus_admin', 'admin', 'faculty', 'scholar']} />}>
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Redirect based on authentication status */}
        <Route path="/" element={
          localStorage.getItem('token') ? (
            <Navigate to={
              JSON.parse(localStorage.getItem('user'))?.role === 'super_admin' ? '/super-admin' :
                JSON.parse(localStorage.getItem('user'))?.role === 'campus_admin' ? '/campus-admin' :
                  JSON.parse(localStorage.getItem('user'))?.role === 'admin' ? '/admin' :
                    JSON.parse(localStorage.getItem('user'))?.role === 'faculty' ? '/faculty' :
                      '/scholar'
            } />
          ) : (
            <Navigate to="/login" />
          )
        } />

        {/* Catch-all route for unmatched URLs */}
        <Route path="*" element={
          localStorage.getItem('token') ? (
            <Navigate to={
              JSON.parse(localStorage.getItem('user'))?.role === 'super_admin' ? '/super-admin' :
                JSON.parse(localStorage.getItem('user'))?.role === 'campus_admin' ? '/campus-admin' :
                  JSON.parse(localStorage.getItem('user'))?.role === 'admin' ? '/admin' :
                    JSON.parse(localStorage.getItem('user'))?.role === 'faculty' ? '/faculty' :
                      '/scholar'
            } />
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}