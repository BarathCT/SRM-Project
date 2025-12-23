import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

function OtpInput({ value, onChange, isLoading }) {
  const inputs = Array.from({ length: 6 }, () => useRef(null));

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (!val) {
      onChange(value.substring(0, idx) + value.substring(idx + 1));
      return;
    }
    const newValue = value.substring(0, idx) + val[val.length - 1] + value.substring(idx + 1);
    onChange(newValue);

    if (val && idx < 5) inputs[idx + 1].current.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      onChange(value.substring(0, idx - 1) + value.substring(idx));
      inputs[idx - 1].current.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Input
          key={idx}
          ref={inputs[idx]}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[idx] || ""}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          disabled={isLoading}
          className="w-10 text-center font-mono text-lg h-12"
          autoFocus={idx === 0}
        />
      ))}
    </div>
  );
}

export default function ForgotPassword({ onClose }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) return;

    setOtpLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      toast.success(
        <div className="space-y-1">
          <div>{data.message}</div>
          <div className="text-sm">Check your inbox and spam folder</div>
        </div>,
        { duration: 5000 }
      );
      setStep(2);
      setResendTimer(60);
      setAttemptsLeft(3);
    } catch (err) {
      console.error("OTP request failed:", err);
      toast.error(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
  e.preventDefault();
  if (otp.length !== 6) {
    toast.error("Please enter the complete 6-digit OTP");
    return;
  }

  setOtpLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: email.trim(), 
        otp: otp.trim() 
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      if (data.message.includes('attempts')) {
        setAttemptsLeft(prev => prev - 1);
      }
      throw new Error(data.message || "OTP verification failed");
    }

    // Store verification timestamp in localStorage
    localStorage.setItem('otpVerified', Date.now().toString());
    
    toast.success(data.message);
    setStep(3);
  } catch (err) {
    console.error("OTP verification error:", err);
    toast.error(err.message || "OTP verification failed. Please try again.");
  } finally {
    setOtpLoading(false);
  }
};

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setOtpLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      toast.success("New OTP sent successfully!");
      setResendTimer(60);
      setOtp("");
      setAttemptsLeft(3);
    } catch (err) {
      console.error("Resend OTP failed:", err);
      toast.error(err.message || "Failed to resend OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
  e.preventDefault();
  
  // Check if verification was recent (within 5 minutes)
    const verificationTime = localStorage.getItem('otpVerified');
    if (!verificationTime || (Date.now() - parseInt(verificationTime)) > 5 * 60 * 1000) {
      toast.error("OTP session expired. Please verify again.");
      setStep(2);
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          otp: otp.trim(), 
          newPassword: newPassword.trim() 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.message.includes('Invalid or expired OTP')) {
          setStep(1);
          setOtp("");
          toast.error("OTP expired. Please request a new one.");
        } else if (data.message.includes('New password must be different')) {
          toast.error("New password must be different from your current password");
        } else if (data.message.includes('User not found')) {
          toast.error("Account not found. Please check your email.");
        } else {
          throw new Error(data.message || "Failed to reset password");
        }
        return;
      }

      toast.success(
        <div className="space-y-1">
          <div>Password reset successfully!</div>
          <div className="text-sm">You can now login with your new password</div>
        </div>
      );
      if (onClose) onClose();
    } catch (err) {
      console.error("Password reset error:", err);
      toast.error(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-lg relative">
      <button
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      
      {step > 1 && (
        <button
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
          onClick={goBack}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      
      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="space-y-5">
          <h2 className="text-2xl font-bold text-center text-gray-800">Forgot Password</h2>
          <div className="text-sm text-gray-600 text-center">
            Enter your institutional email to receive a password reset OTP
          </div>
          
          <div className="space-y-2">
            <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
              <Input
                id="forgot-email"
                type="email"
                placeholder="username@institution.edu"
                className={`pl-10 h-11 ${emailError ? "border-red-500" : ""}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value.trim());
                  validateEmail(e.target.value.trim());
                }}
                disabled={otpLoading}
                required
                autoFocus
              />
            </div>
            {emailError && (
              <div className="text-red-500 text-xs mt-1">{emailError}</div>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            disabled={otpLoading || !!emailError}
          >
            {otpLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : "Send OTP"}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-800">Enter OTP</h2>
          <div className="text-sm text-gray-600 text-center">
            We sent a 6-digit code to <span className="font-semibold">{email}</span>
          </div>
          
          <OtpInput value={otp} onChange={setOtp} isLoading={otpLoading} />
          
          {attemptsLeft < 3 && (
            <div className="text-sm text-center text-red-500">
              {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
            </div>
          )}
          
          <div className="flex items-center justify-center text-sm text-gray-600">
            Didn't receive code?{" "}
            <Button
              variant="link"
              type="button"
              className="text-blue-600 hover:text-blue-800 px-1 h-auto"
              onClick={handleResendOtp}
              disabled={resendTimer > 0 || otpLoading}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
            </Button>
          </div>
          
          <Button
            type="submit"
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            disabled={otpLoading || otp.length !== 6}
          >
            {otpLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : "Verify OTP"}
          </Button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <h2 className="text-2xl font-bold text-center text-gray-800">New Password</h2>
          <div className="text-sm text-gray-600 text-center">
            Create a strong new password (min 8 characters)
          </div>
          
          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                className="pl-10 h-11 pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                className="pl-10 h-11 pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : "Reset Password"}
          </Button>
        </form>
      )}
    </div>
  );
}