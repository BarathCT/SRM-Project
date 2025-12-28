import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/Toast';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import ForgotPassword from './ForgotPassword';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Validation - form should handle these
    if (!email || !password || !emailRegex.test(email)) {
      toast.error('Please enter valid email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(data.message || 'Invalid email or password');
        }
        throw new Error(data.message || 'Login failed');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      localStorage.setItem('user', JSON.stringify(data.user));
      // Login successful - redirect handles feedback

      switch (data.user.role) {
        case 'super_admin':
          navigate('/super-admin');
          break;
        case 'campus_admin':
          navigate('/campus-admin');
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
    // Contact support - user can see the button, no need for toast
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 sm:px-6 py-8"
      style={{
        background: "linear-gradient(135deg, #e3f0fd 0%, #ffffff 80%, #c7e6fe 100%)"
      }}
    >
      <div className="w-full max-w-sm sm:max-w-md rounded-xl bg-white border border-gray-200 px-5 sm:px-8 py-6 sm:py-8 flex flex-col items-center shadow-lg">
        <img
          src="/logo.jpg"
          alt="ScholarSync"
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg object-cover shadow mb-3 border border-blue-100"
          draggable={false}
        />
        <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-1 tracking-tight">
          ScholarSync
        </h2>
        <span className="text-sm sm:text-base text-blue-500 mb-4 sm:mb-5 text-center">Research Management Portal</span>
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-3 sm:gap-4"
          noValidate
        >
          {/* Email Field */}
          <div>
            <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-blue-800 mb-1 block">
              Email
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              </span>
              <Input
                id="email"
                type="email"
                placeholder="username@institution.edu"
                className="pl-10 sm:pl-11 h-10 sm:h-11 text-sm sm:text-base border border-blue-200 rounded-md bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-300 text-blue-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>
          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-blue-800">
                Password
              </Label>
              <Button
                variant="link"
                type="button"
                className="text-xs h-auto px-0 text-blue-600 hover:text-blue-900"
                onClick={() => setShowForgot(true)}
                disabled={loading}
              >
                Forgot?
              </Button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              </span>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="pl-10 sm:pl-11 pr-10 sm:pr-11 h-10 sm:h-11 text-sm sm:text-base border border-blue-200 rounded-md bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-300 text-blue-900"
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
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300 hover:text-blue-500" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300 hover:text-blue-500" />
                )}
              </button>
            </div>
          </div>
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-11 sm:h-12 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base shadow transition min-h-[44px]"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : 'Sign In'}
          </Button>
          <div className="text-center">
            <Button
              variant="link"
              className="text-blue-700 hover:text-blue-900 text-xs h-auto px-0"
              onClick={handleContactSupport}
              disabled={loading}
              type="button"
            >
              Need help? Contact support
            </Button>
          </div>
        </form>
        <footer className="mt-4 sm:mt-5 text-xs text-blue-300 text-center w-full">
          &copy; {new Date().getFullYear()} ScholarSync. Powered by SRM Group.
        </footer>
      </div>
      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <ForgotPassword onClose={() => setShowForgot(false)} />
        </div>
      )}
    </div>
  );
}