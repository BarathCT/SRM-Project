import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // If you don't have this, remove and see fallback below.
import { GraduationCap, RefreshCw, Users, Clock } from "lucide-react";

/**
 * DashboardHeader
 * Professional white/blue header for dashboards.
 *
 * Props:
 * - title: string (required)
 * - subtitle?: string
 * - userName?: string
 * - dateTime?: string (pre-formatted)
 * - showRefresh?: boolean (default: true)
 * - refreshing?: boolean (default: false)
 * - onRefresh?: () => void
 * - actions?: React.ReactNode (right-side custom actions)
 * - icon?: React.ReactNode (default: <GraduationCap />)
 * - className?: string
 *
 * Color palette: white, black, blue, light-blue
 */
export default function DashboardHeader({
  title,
  subtitle,
  userName,
  dateTime,
  showRefresh = true,
  refreshing = false,
  onRefresh,
  actions,
  icon,
  className,
}) {
  return (
    <div className={cn("mb-8 border-b border-blue-100 pb-6", className)}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Title and meta */}
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              {icon || <GraduationCap className="h-6 w-6" />}
            </span>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {title}
            </h1>
          </div>

          {(subtitle || userName || dateTime) && (
            <div className="mt-2 flex flex-col md:flex-row md:items-center md:gap-4 text-sm">
              {subtitle && (
                <p className="text-gray-700">{subtitle}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-1 md:mt-0">
                {userName && (
                  <span className="inline-flex items-center gap-1.5 text-gray-700">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-700">{userName}</span>
                  </span>
                )}
                {dateTime && (
                  <span className="inline-flex items-center gap-1.5 text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{dateTime}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {actions}

          {showRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              className="border-blue-200 hover:border-blue-400 hover:bg-blue-50"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4 mr-2",
                  refreshing ? "animate-spin text-blue-600" : ""
                )}
              />
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}