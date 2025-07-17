import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const validateAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user') 
          ? JSON.parse(localStorage.getItem('user')) 
          : null;

        // No token case
        if (!token) {
          toast.error('Please log in to access this page');
          setIsAuthorized(false);
          setIsValidating(false);
          return;
        }

        // Verify token structure and expiration
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        // Token expired
        if (decoded.exp < currentTime) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.warning('Your session has expired. Please log in again.');
          setIsAuthorized(false);
          setIsValidating(false);
          return;
        }

        // Verify token has required data
        if (!decoded.role || !decoded.userId || !decoded.email) {
          throw new Error('Invalid token structure');
        }

        // Update user data if needed
        if (!user || user._id !== decoded.userId) {
          const updatedUser = {
            _id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            college: decoded.college || 'N/A',
            category: decoded.category || 'N/A'
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        // Check role permissions
        if (!allowedRoles || allowedRoles.includes(decoded.role)) {
          setIsAuthorized(true);
        } else {
          toast.warning(`You don't have permission to access this page.`);
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error('Authentication error:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Invalid session. Please log in again.');
        setIsAuthorized(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateAuth();
  }, [location.pathname, allowedRoles]);

  if (isValidating) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    // Get the appropriate redirect path based on user role
    const user = localStorage.getItem('user') 
      ? JSON.parse(localStorage.getItem('user')) 
      : null;
    
    const redirectPath = user?.role 
      ? `/${user.role.replace('_', '-')}`
      : '/login';

    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }

  return <Outlet />;
}