import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      // Store token and user data
      localStorage.setItem('token', data.token);
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
        case 'scholar':
          navigate('/scholar');
          break;
        default:
          toast.error('Unknown role. Contact admin.');
          break;
      }
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/95 border border-gray-100 shadow-lg rounded-xl overflow-hidden">
        {/* Header with subtle gradient */}
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
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  required
                  autoComplete="username"
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
                  onClick={() => toast.info('Please contact your administrator to reset your password')}
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
                  required
                  minLength={8}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
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
              className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-medium text-base shadow-sm transition-colors duration-200"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </Button>

            {/* Help Section */}
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                Need help?{' '}
                <Button 
                  variant="link" 
                  className="text-blue-500 hover:text-blue-600 text-xs h-auto px-0"
                  onClick={() => toast.info('Please contact your campus administrator for assistance')}
                >
                  Contact support
                </Button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}