import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/Toast';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import ForgotPassword from './ForgotPassword';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      toast.error('Email is required');
      return;
    }
    if (!password) {
      toast.error('Password is required');
      return;
    }
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // For HTTP-only cookies if used in backend
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password.trim() 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error(data.message || 'Invalid email or password');
        }
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user info in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Login successful');

      // Redirect based on role
      switch(data.user.role) {
        case 'super_admin':
          navigate('/super-admin');
          break;
        case 'campus_admin':
          navigate('/campus-admin');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'faculty':
          navigate('/faculty');
          break;
        default:
          toast.warning('Unknown role. Contact admin.');
          navigate('/');
          break;
      }
    } catch (err) {
      let errorMessage = err.message;
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please try again later.';
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    toast.info('Please contact your campus administrator for assistance', { duration: 8000 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/95 border border-gray-100 shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="text-center space-y-4 pb-0 bg-gradient-to-r from-blue-400 to-blue-600 text-white pt-8">
          <div className="flex flex-col items-center">
            <div className="bg-white p-2 rounded-full shadow-md mb-3">
              <img
                src="/logo.jpg"
                alt="ScholarSync"
                className="h-14 w-14 rounded-full object-cover"
              />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              ScholarSync
            </CardTitle>
            <CardDescription className="text-blue-100 my-3">
              Research Management Portal
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Institutional Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-blue-500" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="username@institution.edu"
                  className="pl-10 h-11 text-base focus-visible:ring-blue-500 focus-visible:ring-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Button
                  variant="link"
                  type="button"
                  className="text-blue-600 hover:text-blue-800 text-xs h-auto px-0"
                  onClick={() => setShowForgot(true)}
                  disabled={loading}
                >
                  Forgot password?
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-blue-500" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 h-11 text-base focus-visible:ring-blue-500 focus-visible:ring-2 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : 'Sign In'}
            </Button>

            {/* Help Section */}
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                Need help?{' '}
                <Button 
                  variant="link" 
                  className="text-blue-500 hover:text-blue-600 text-xs h-auto px-0"
                  onClick={handleContactSupport}
                  disabled={loading}
                >
                  Contact support
                </Button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <ForgotPassword onClose={() => setShowForgot(false)} />
        </div>
      )}
    </div>
  );
}