import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Settings,
  Upload,
  Users,
  FilePlus,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/Toast';
import api from '@/lib/api';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const decoded = jwtDecode(token);
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          console.warn('Token expired');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }

        const response = await api.get('/settings');
        const responseData = response.data;

        // Handle response structure: { success: true, data: {...} } or direct data
        const userData = responseData.success ? responseData.data : responseData;

        if (userData) {
          const fullUserData = {
            ...decoded,
            ...userData
          };
          setUser(fullUserData);
          // Save to localStorage for caching (useful for Render cold starts)
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          throw new Error('Invalid response structure');
        }
      } catch (err) {
        // Only remove token and redirect on authentication errors (401, 403)
        const isAuthError = err.response?.status === 401 || err.response?.status === 403;
        const isTimeoutError = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
        const isNetworkError = !err.response && (err.message?.includes('Network') || err.message?.includes('ERR_NETWORK'));
        
        console.error('Failed to fetch user data:', {
          message: err.message,
          status: err.response?.status,
          code: err.code,
          isAuthError,
          isTimeoutError,
          isNetworkError,
          error: err
        });

        if (isAuthError) {
          // Token is invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          // For timeout/network errors, use cached user data from localStorage
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            try {
              const userData = JSON.parse(cachedUser);
              const decoded = jwtDecode(token);
              setUser({
                ...decoded,
                ...userData
              });
              if (isTimeoutError) {
                console.warn('API timeout - using cached user data. Backend may be starting up.');
              } else {
                console.warn('Using cached user data due to API error:', err.message);
              }
            } catch (parseErr) {
              console.error('Failed to parse cached user data:', parseErr);
              // If we can't parse cached data and it's a timeout, just keep trying in background
              if (!isTimeoutError) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
              }
            }
          } else if (isTimeoutError || isNetworkError) {
            // Timeout/network error but no cached data - backend might be starting
            // Don't remove token, user might be able to retry
            console.warn('API timeout/network error. Backend may be starting up. Token preserved.');
          } else {
            // Other errors - log but don't remove token
            console.warn('Error fetching user data, but token preserved:', err.message);
          }
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
    // Logout successful - redirect handles feedback
  };

  /**
   * Author ID requirement:
   * Now BOTH faculty and campus_admin must have at least one Author ID
   * (Scopus, SCI, or Web of Science) to upload research papers.
   */
  const ROLES_REQUIRING_AUTHOR_ID = ['faculty', 'campus_admin'];

  const checkAuthorIdRequirement = async () => {
    if (!user || !ROLES_REQUIRING_AUTHOR_ID.includes(user.role)) {
      // Other roles are exempt
      return true;
    }

    const hasAtLeastOneAuthorId = !!(
      user.authorId?.scopus ||
      user.authorId?.sci ||
      user.authorId?.webOfScience
    );

    return hasAtLeastOneAuthorId;
  };

  const handleUploadClick = async () => {
    setLoading(true);

    try {
      const canUpload = await checkAuthorIdRequirement();

      if (!canUpload) {
        toast.warning(
          'Add at least one Author ID (Scopus, SCI, or Web of Science) in Settings to upload papers',
          {
            duration: 5000
          }
        );
        return;
      }

      navigate(getUploadPath());
    } catch (error) {
      console.error('Error checking Author ID requirement:', error);
      // Error checking - user can still try to upload
      console.error('Error checking Author ID requirement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFromDropdown = async () => {
    setLoading(true);

    try {
      const canUpload = await checkAuthorIdRequirement();

      if (!canUpload) {
        toast.warning(
          'Add at least one Author ID in Settings to upload papers',
          {
            duration: 5000
          }
        );
        return;
      }

      navigate(getUploadPath());
    } catch (error) {
      console.error('Error checking Author ID requirement:', error);
      // Error checking - user can still try to upload
      console.error('Error checking upload permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const getInitials = (name) => {
    if (!name) return 'US';
    const names = name.trim().split(' ');
    return names.map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (user.fullName) return user.fullName;
    if (user.email) return user.email.split('@')[0];
    return 'User';
  };

  const getEmail = () => user.email || '';

  const handleManageUsers = () => {
    if (!user.role) return;

    switch (user.role) {
      case 'super_admin':
        navigate('/super-admin/users');
        break;
      case 'campus_admin':
        navigate('/campus-admin/users');
        break;
      default:
        navigate('/users');
    }
  };

  const getDashboardPath = () => {
    if (!user.role) return '/';
    switch (user.role) {
      case 'super_admin':
        return '/super-admin';
      case 'campus_admin':
        return '/campus-admin';
      case 'admin':
        return '/admin';
      case 'faculty':
      case 'scholar':
        return '/faculty';
      default:
        return '/';
    }
  };

  const getUploadPath = () => {
    if (!user.role) return '/';
    switch (user.role) {
      case 'faculty':
        return '/faculty/upload';
      case 'campus_admin':
        return '/campus-admin/upload';
      default:
        return '/upload';
    }
  };

  // Roles permitted to see upload button
  const canUpload = user.role && [
    'campus_admin',
    'admin',
    'faculty',
    'scholar'
  ].includes(user.role);

  // Roles permitted to manage users
  const canManageUsers = user.role && ['super_admin', 'campus_admin', 'admin'].includes(user.role);

  // Author ID presence indicator applies to both faculty and campus_admin now
  const requiresAuthorIds = ROLES_REQUIRING_AUTHOR_ID.includes(user.role);
  const hasAuthorIds = !requiresAuthorIds
    ? true
    : !!(
      user.authorId?.scopus ||
      user.authorId?.sci ||
      user.authorId?.webOfScience
    );

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b px-6 py-3 flex items-center justify-between">
      {/* Left: Logo and Title */}
      <Link
        to={getDashboardPath()}
        className="flex items-center space-x-3 group"
      >
        <div className="p-1.5 rounded-lg transition-all">
          <img
            src="/logo.jpg"
            alt="ScholarSync"
            className="h-9 w-9 rounded-lg object-cover border-2 border-white/20"
          />
        </div>
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent">
          ScholarSync
        </span>
      </Link>

      {/* Right: Actions and Profile Dropdown */}
      <div className="flex items-center gap-4">
        {/* Upload Button */}
        {canUpload && (
          <div className="relative">
            <Button
              variant="default"
              size="sm"
              onClick={handleUploadClick}
              disabled={loading}
              className={`gap-2 shadow-sm transition-colors ${
                hasAuthorIds
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <FilePlus className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Upload Research</span>
              <span className="sm:hidden">Upload</span>
            </Button>

            {/* Warning indicator for required roles without Author IDs */}
            {requiresAuthorIds && !hasAuthorIds && (
              <div className="absolute -top-1 -right-1">
                <AlertCircle className="h-4 w-4 text-orange-500 bg-white rounded-full" />
              </div>
            )}
          </div>
        )}

        {/* User Management Button */}
        {canManageUsers && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleManageUsers}
            className="gap-2 border-blue-500 text-blue-500 hover:bg-blue-50 shadow-sm transition-colors"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Manage Users</span>
            <span className="sm:hidden">Users</span>
          </Button>
        )}

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-3 py-8 rounded-lg hover:bg-gray-100/50 focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <Avatar className="h-8 w-8 border border-gray-200">
                <AvatarImage src="" alt={getDisplayName()} />
                <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                  {getInitials(user.fullName || user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start gap-0.5">
                <span className="ml-1 text-sm font-medium text-gray-900 truncate max-w-[120px]">
                  {getDisplayName()}
                </span>
                {user.role && (
                  <Badge
                    variant={
                      user.role === 'super_admin' ? 'default' :
                        user.role === 'campus_admin' ? 'secondary' :
                          user.role === 'admin' ? 'outline' :
                            'destructive'
                    }
                    className="h-5 text-xs capitalize px-1.5"
                  >
                    {user.role.replace('_', ' ')}
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500 ml-1" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-md border">
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-gray-500">
              Account
            </DropdownMenuLabel>
            <DropdownMenuItem className="px-2 py-1.5 rounded-md">
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src="" alt={getDisplayName()} />
                  <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                    {getInitials(user.fullName || user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {getEmail()}
                  </p>
                  {user.role && (
                    <Badge
                      variant={
                        user.role === 'super_admin' ? 'default' :
                          user.role === 'campus_admin' ? 'secondary' :
                            user.role === 'admin' ? 'outline' :
                              'destructive'
                      }
                      className="h-5 text-xs capitalize mt-1 w-fit"
                    >
                      {user.role.replace('_', ' ')}
                    </Badge>
                  )}
                  {user.college && user.college !== 'N/A' && (
                    <span className="text-xs text-gray-500 mt-1 truncate">
                      {user.college}
                    </span>
                  )}
                  {/* Author ID Status for roles that require IDs */}
                  {requiresAuthorIds && (
                    <div className="flex items-center gap-1 mt-1">
                      {hasAuthorIds ? (
                        <Badge variant="outline" className="h-4 text-xs text-green-600 border-green-300">
                          Author IDs ✓
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="h-4 text-xs text-orange-600 border-orange-300">
                          Author IDs Required
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem
              onClick={() => navigate(getDashboardPath())}
              className="px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
            >
              <LayoutDashboard className="mr-2 h-4 w-4 text-gray-500" />
              Dashboard
            </DropdownMenuItem>

            {canManageUsers && (
              <DropdownMenuItem
                onClick={handleManageUsers}
                className="px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4 text-gray-500" />
                Manage Users
              </DropdownMenuItem>
            )}

            {canUpload && (
              <DropdownMenuItem
                onClick={handleUploadFromDropdown}
                disabled={loading}
                className="px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                <div className="flex items-center w-full">
                  {loading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
                  ) : (
                    <FilePlus className="mr-2 h-4 w-4 text-gray-500" />
                  )}
                  Upload Research
                  {requiresAuthorIds && !hasAuthorIds && (
                    <AlertCircle className="ml-auto h-4 w-4 text-orange-500" />
                  )}
                </div>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              asChild
              className="px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
            >
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4 text-gray-500" />
                Account Settings
                {requiresAuthorIds && !hasAuthorIds && (
                  <AlertCircle className="ml-auto h-4 w-4 text-orange-500" />
                )}
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="px-2 py-1-5 text-sm text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}