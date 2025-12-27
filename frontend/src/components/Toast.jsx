// components/Toast.jsx
import { useState, useEffect, createContext, useContext } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, Bookmark, GraduationCap } from 'lucide-react';
import { cva } from 'class-variance-authority';

// Academic-themed color variants
const toastVariants = cva(
  'flex w-full items-start gap-3 rounded-lg border-l-4 p-4 pr-8 border border-gray-200 transition-all duration-300 relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-white border-l-slate-300 text-slate-800',
        success: 'bg-green-50 border-l-green-600 text-green-900',
        error: 'bg-red-50 border-l-red-600 text-red-900',
        warning: 'bg-yellow-50 border-l-yellow-500 text-yellow-900',
        info: 'bg-blue-50 border-l-blue-600 text-blue-900',
        academic: 'bg-slate-50 border-l-slate-700 text-slate-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Academic-themed icons
const iconMap = {
  success: <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />,
  error: <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />,
  info: <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />,
  academic: <GraduationCap className="h-5 w-5 mt-0.5 flex-shrink-0" />,
};

// Toast Context
const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = (message, options = {}) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast = { 
      id, 
      message,
      ...options,
      createdAt: Date.now()
    };
    
    setToasts((prev) => [...prev, toast]);
    
    if (options.duration !== Infinity) {
      setTimeout(() => dismiss(id), options.duration || 5000);
    }
    
    return id;
  };

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Academic-themed toast methods
  toast.success = (message, options) => toast(message, { ...options, type: 'success' });
  toast.error = (message, options) => toast(message, { ...options, type: 'error' });
  toast.warning = (message, options) => toast(message, { ...options, type: 'warning' });
  toast.info = (message, options) => toast(message, { ...options, type: 'info' });
  toast.academic = (message, options) => toast(message, { 
    ...options, 
    type: 'academic',
    icon: <Bookmark className="h-5 w-5 mt-0.5 flex-shrink-0" />
  });

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] space-y-3 w-[380px] max-w-[calc(100vw-2rem)]">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type || 'info'}
            icon={toast.icon}
            duration={toast.duration}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ id, message, type = 'info', icon, duration = 5000, onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 300);
  };

  useEffect(() => {
    if (duration === Infinity) return;
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (!isHovered) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        setProgress((remaining / duration) * 100);
        
        if (remaining <= 0) {
          handleDismiss();
        }
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [duration, isHovered]);

  return (
    <div
      className={cn(
        toastVariants({ variant: type }),
        isExiting ? 'animate-out fade-out slide-out-to-right-full' : 'animate-in fade-in slide-in-from-right-full',
        'group hover:shadow-lg transition-shadow'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon || iconMap[type]}
      
      <div className="flex-1">
        <p className="text-sm font-medium leading-tight">{message}</p>
        {type === 'academic' && (
          <div className="mt-1 text-xs text-muted-foreground opacity-80">
            ScholarSync Notification
          </div>
        )}
      </div>
      
      <button
        onClick={handleDismiss}
        className={cn(
          "absolute right-2 top-2 rounded-sm p-1",
          "text-muted-foreground hover:text-foreground hover:bg-black/5",
          "transition-colors opacity-0 group-hover:opacity-100",
          "focus:opacity-100 focus:outline-none"
        )}
        aria-label="Dismiss toast"
      >
        <X className="h-4 w-4" />
      </button>
      
      {duration !== Infinity && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-current opacity-20 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      )}
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Utility function (if not using shadcn's cn)
function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}