import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SplashScreen({ onComplete }) {
  const [logoVisible, setLogoVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Animate logo in
    const logoTimer = setTimeout(() => {
      setLogoVisible(true);
    }, 100);

    // Animate text in after logo
    const textTimer = setTimeout(() => {
      setTextVisible(true);
    }, 600);

    // Redirect after animation completes
    const redirectTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
      
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const role = user?.role;
          
          if (role === 'super_admin') {
            navigate('/super-admin', { replace: true });
          } else if (role === 'campus_admin') {
            navigate('/campus-admin', { replace: true });
          } else if (role === 'admin') {
            navigate('/admin', { replace: true });
          } else if (role === 'faculty') {
            navigate('/faculty', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        } catch (error) {
          navigate('/login', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    }, 2500); // Total animation duration

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      {/* Logo Animation */}
      <div
        className={`transition-all duration-700 ease-out ${
          logoVisible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-90 translate-y-4'
        }`}
      >
        <img
          src="/logo-without-bg.png"
          alt="Scholar Sync Logo"
          className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain"
        />
      </div>

      {/* Text Animation */}
      <div
        className={`mt-8 transition-all duration-800 ease-out ${
          textVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-6'
        }`}
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
          <span 
            className="inline-block" 
            style={{ 
              animation: textVisible ? 'fadeInUp 0.8s ease-out 0.1s forwards' : 'none',
              opacity: textVisible ? undefined : 0
            }}
          >
            Scholar
          </span>
          <span 
            className="inline-block ml-3 text-blue-600" 
            style={{ 
              animation: textVisible ? 'fadeInUp 0.8s ease-out 0.3s forwards' : 'none',
              opacity: textVisible ? undefined : 0
            }}
          >
            sync
          </span>
        </h1>
      </div>

      {/* Subtle loading indicator */}
      <div className="mt-12 flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full bg-blue-600 transition-all duration-300 ${
              textVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              animation: textVisible
                ? `splashPulse 1.5s ease-in-out infinite ${i * 0.2}s`
                : 'none',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes splashPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}

