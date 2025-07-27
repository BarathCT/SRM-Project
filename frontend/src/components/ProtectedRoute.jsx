import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

/**
 * ProtectedRoute ensures only authenticated users with allowedRoles can access the route.
 * - Reads token & user from localStorage (set at login).
 * - If not authenticated, redirects to login.
 * - If not authorized for role, redirects to the correct dashboard.
 * - Handles token expiration and structure.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();
  const [status, setStatus] = useState('validating'); // 'validating', 'authorized', 'unauthorized', 'forbidden'
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user') 
          ? JSON.parse(localStorage.getItem('user')) 
          : null;

        if (!token || !user) {
          setStatus('unauthorized');
          setUserRole(null);
          return;
        }

        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        // Token expired
        if (decoded.exp < currentTime) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setStatus('unauthorized');
          setUserRole(null);
          return;
        }

        // Token structure check
        if (!decoded.role || !decoded.userId || !decoded.email) {
          setStatus('unauthorized');
          setUserRole(null);
          return;
        }

        // Role check
        if (!allowedRoles || allowedRoles.includes(decoded.role)) {
          setStatus('authorized');
          setUserRole(decoded.role);
        } else {
          setStatus('forbidden');
          setUserRole(decoded.role);
        }
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setStatus('unauthorized');
        setUserRole(null);
      }
    };

    checkAuth();
  }, [location.pathname, allowedRoles]);

  // Loading spinner while checking
  if (status === 'validating') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Not logged in: always go to /login
  if (status === 'unauthorized') {
    toast.error('Please log in to access this page');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Role not allowed: redirect to user's dashboard
  if (status === 'forbidden') {
    toast.warning("You don't have permission to access this page.");
    // Map role to dashboard path:
    let dashboard = '/';
    if (userRole) {
      dashboard = {
        super_admin: '/super-admin',
        campus_admin: '/campus-admin',
        admin: '/admin',
        faculty: '/faculty',
      }[userRole] || '/';
    }
    return <Navigate to={dashboard} replace />;
  }

  // All good!
  return <Outlet />;
}