import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * LoadingSpinner - Minimal classic spinner component
 */
export function LoadingSpinner({ 
  size = "md", 
  className,
  text 
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
      {text && (
        <span className="text-sm font-medium text-gray-600">{text}</span>
      )}
    </div>
  );
}

/**
 * PageLoader - Full page loading with backdrop (Professional minimal design)
 */
export function PageLoader({ 
  message = "Loading...", 
  fullScreen = true 
}) {
  const containerClass = fullScreen 
    ? "fixed inset-0 flex items-center justify-center bg-white z-50"
    : "flex items-center justify-center min-h-[400px] py-12";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin"></div>
        <p className="text-sm font-medium text-gray-600">{message}</p>
      </div>
    </div>
  );
}

/**
 * InlineLoader - Inline loading for sections
 */
export function InlineLoader({ message }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin"></div>
        {message && (
          <p className="text-xs font-medium text-gray-500">{message}</p>
        )}
      </div>
    </div>
  );
}

