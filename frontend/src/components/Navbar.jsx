import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { User, LogOut, ChevronDown, LayoutDashboard, Settings, Upload, Users, FilePlus } from 'lucide-react';
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
import { toast } from 'sonner';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (err) {
        console.error('Invalid token');
        localStorage.removeItem('token');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
    toast.success('You have been logged out successfully');
  };

  if (!user) return null;

  // Get initials from email for avatar fallback
  const getInitials = (email) => {
    const parts = email.split('@')[0].split(/[._]/);
    return parts.map(part => part.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  // Determine dashboard path based on role
  const getDashboardPath = () => {
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

  // Check if user can upload research papers
  const canUpload = ['admin', 'faculty', 'scholar'].includes(user.role);

  // Check if user can manage users
  const canManageUsers = ['super_admin', 'campus_admin', 'admin'].includes(user.role);

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
          <Button 
            variant="default"
            size="sm"
            onClick={() => navigate("/upload")}
            className="gap-2 bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-colors"
          >
            <FilePlus className="h-4 w-4" />
            <span className="hidden sm:inline">Upload Research</span>
            <span className="sm:hidden">Upload</span>
          </Button>
        )}
        
        {/* User Management Button (for super_admin, campus_admin, admin) */}
        {canManageUsers && (
          <Button 
            variant="outline"
            size="sm"
            onClick={() => navigate("/users")}
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
                <AvatarImage src="" alt={user.email} />
                <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                  {getInitials(user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start gap-0.5">
                <span className="ml-1 text-sm font-medium text-gray-900 truncate max-w-[120px]">
                  {user.email.split('@')[0]}
                </span>
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
                  <AvatarImage src="" alt={user.email} />
                  <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                    {getInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.email}
                  </p>
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
                  {user.college && user.college !== 'N/A' && (
                    <span className="text-xs text-gray-500 mt-1 truncate">
                      {user.college}
                    </span>
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
                onClick={() => navigate("/upload")}
                className="px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                <FilePlus className="mr-2 h-4 w-4 text-gray-500" />
                Upload Research
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem 
              asChild
              className="px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
            >
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4 text-gray-500" />
                Account Settings
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