import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/Toast';

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Super Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/users" element={<UserManagement />} />
            <Route path="/super-admin/edit/:type/:id" element={<EditSelector />} />
          </Route>

          {/* Campus Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={['campus_admin']} />}>
            <Route path="/campus-admin" element={<CampusAdminDashboard />} />
            <Route path="/campus-admin/users" element={<UserManagement />} />
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
      </Router>
    </ToastProvider>
  );
}