import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { User, LogOut, ChevronDown, LayoutDashboard, Settings, Upload, Users, FilePlus, AlertCircle } from 'lucide-react';
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
        const response = await fetch('/api/settings', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();

        setUser({
          ...decoded,
          ...(data.data || data)
        });
      } catch (err) {
        console.error('Invalid token or failed to fetch user data');
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
    toast.success('You have been logged out successfully');
  };

  // Check if faculty user has at least one Author ID
  const checkAuthorIdRequirement = async () => {
    if (!user || user.role !== 'faculty') {
      return true; // Non-faculty users can upload without Author IDs
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
          'Author ID Required: You need to add at least one Author ID (Scopus, SCI, or Web of Science) before uploading research papers. Please go to Settings to add your Author IDs.',
          {
            duration: 8000,
            action: {
              label: 'Go to Settings',
              onClick: () => navigate('/settings')
            }
          }
        );
        return;
      }

      // If validation passes, navigate to upload page
      navigate(getUploadPath());
      
    } catch (error) {
      console.error('Error checking Author ID requirement:', error);
      toast.error('Unable to verify Author ID requirements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFromDropdown = async () => {
    setLoading(true);
    
    try {
      const canUpload = await checkAuthorIdRequirement();
      
      if (!canUpload) {
        toast.academic(
          'Research Upload Restricted: Faculty members must have at least one Author ID (Scopus, SCI, or Web of Science) to upload research papers.',
          {
            duration: 10000
          }
        );
        
        // Show additional info toast with action
        setTimeout(() => {
          toast.info(
            'To add your Author IDs, go to Account Settings and fill in your research identifiers.',
            {
              duration: 8000
            }
          );
        }, 1000);
        
        return;
      }

      navigate("/upload");
      
    } catch (error) {
      console.error('Error checking Author ID requirement:', error);
      toast.error('Unable to verify upload permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Get initials from full name or email for avatar fallback
  const getInitials = (name) => {
    if (!name) return 'US';
    const names = name.trim().split(' ');
    return names.map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase();
  };

  // Get display name - fallback from email if fullName doesn't exist
  const getDisplayName = () => {
    if (user.fullName) return user.fullName;
    if (user.email) return user.email.split('@')[0];
    return 'User';
  };

  // Get email or return empty string if undefined
  const getEmail = () => {
    return user.email || '';
  };

  const handleManageUsers = () => {
  if (!user?.role) return;
  
  switch(user.role) {
    case 'super_admin':
      navigate('/super-admin/users');
      break;
    case 'campus_admin':
      navigate('/campus-admin/users');
      break;
    case 'admin':
      navigate('/admin/users');
      break;
    default:
      navigate('/');
  }
};
  // Determine dashboard path based on role
  const getDashboardPath = () => {
    if (!user.role) return '/';
    switch(user.role) {
      case 'super_admin':
        return '/super-admin';
      case 'campus_admin':
        return '/campus-admin';
      case 'admin':
        return '/admin';
      case 'faculty':
      case 'scholar':
        return '/dashboard';
      default:
        return '/';
    }
  };

  const getUploadPath = () => {
    if (!user.role) return '/';
    switch(user.role) {
      case 'faculty':
        return '/faculty/upload';
      default:
        return '/upload';
    }
  };

  // Check if user can upload research papers
  const canUpload = user.role && ['admin', 'faculty', 'scholar'].includes(user.role);

  // Check if user can manage users
  const canManageUsers = user.role && ['super_admin', 'campus_admin', 'admin'].includes(user.role);

  // Check if faculty has Author IDs for visual indicator
  const hasAuthorIds = user.role === 'faculty' ? !!(
    user.authorId?.scopus || 
    user.authorId?.sci || 
    user.authorId?.webOfScience
  ) : true;

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
        {/* Upload Button (for admin, faculty, scholar) */}
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
            
            {/* Warning indicator for faculty without Author IDs */}
            {user.role === 'faculty' && !hasAuthorIds && (
              <div className="absolute -top-1 -right-1">
                <AlertCircle className="h-4 w-4 text-orange-500 bg-white rounded-full" />
              </div>
            )}
          </div>
        )}
        
        {/* User Management Button (for super_admin, campus_admin, admin) */}
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

          <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-lg border">
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
                  {/* Author ID Status for Faculty */}
                  {user.role === 'faculty' && (
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
                onClick={() => navigate("/users")}
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
                  {user.role === 'faculty' && !hasAuthorIds && (
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
                {user.role === 'faculty' && !hasAuthorIds && (
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