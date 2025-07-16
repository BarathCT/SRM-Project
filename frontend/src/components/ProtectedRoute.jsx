import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  try {
    const decoded = jwtDecode(token);
    if (!allowedRoles || allowedRoles.includes(decoded.role)) {
      return <Outlet />;
    } else {
      return <Navigate to={`/${decoded.role}`} replace />;
    }
  } catch (err) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
}
