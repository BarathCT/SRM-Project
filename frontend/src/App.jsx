import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserDashboard from './pages/User/UserDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import UserManagement from './pages/Admin/UserManagement/UserManagement';
import UploadPage from './pages/User/UploadPage';

export default function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* User-only routes */}
        <Route element={<ProtectedRoute allowedRoles={['user']} />}>
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/upload" element={<UploadPage/>} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
        </Route>

        {/* Catch-all */}
        {/* <Route path="*" element={<Navigate to="/login" />} /> */}
      </Routes>
    </Router>

  );
}
