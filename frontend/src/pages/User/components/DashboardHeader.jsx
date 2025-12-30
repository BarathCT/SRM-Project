import React from "react";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  Users,
  Clock,
  Search,
  BarChart3,
} from "lucide-react";

/**
 * DashboardHeader
 * Responsive: Stacks vertically on mobile, columns on desktop.
 * 
 * Props:
 * - title: string
 * - subtitle?: string
 * - userName?: string
 * - dateTime?: string
 * - actions?: React.ReactNode
 * - icon?: React.ReactNode
 * - className?: string
 * - showTabSwitch?: boolean
 * - activeTab?: string
 * - onTabChange?: (tab: string) => void
 * - onShowAnalytics?: () => void
 * - facultyFinderOpen?: boolean
 * - onFacultyFinderOpenChange?: (open: boolean) => void
 * - role?: "super-admin" | "campus-admin" | "faculty"
 * 
 * Any extra props are ignored.
 */
export default function DashboardHeader({
  title,
  subtitle,
  userName,
  dateTime,
  actions,
  icon,
  className,
  // Tab switching (showTabSwitch = false for super admin, true for campus admin)
  showTabSwitch = false,
  activeTab = "institute",
  onTabChange,
  // Finders and modals
  onShowAnalytics,
  facultyFinderOpen = false,
  onFacultyFinderOpenChange,
  // Role for permission-based rendering
  role = "faculty",
}) {
  // Only show analytics and faculty finder for campus/super admin
  const canShowAdminActions =
    role === "super-admin" || role === "campus-admin";

  return (
    <div className={cn("mb-6 sm:mb-8 border-blue-100 pb-4 sm:pb-6 bg-gradient-to-r from-white-50/50 to-white", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Title and meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {icon !== null && (
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shrink-0">
                {icon || <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-gray-600 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          {(userName || dateTime) && (
            <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              {userName && (
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                  <span className="font-medium text-gray-700 truncate max-w-[120px] sm:max-w-none">{userName}</span>
                </div>
              )}
              {dateTime && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{dateTime}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Tab Switcher (for campus admin etc.) */}
          {showTabSwitch && (
            <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 py-1 sm:py-1.5 bg-white border border-blue-100 rounded-lg shadow-sm">
              <button
                type="button"
                className={cn(
                  "px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition min-h-[36px] sm:min-h-0",
                  activeTab === "institute"
                    ? "bg-blue-100 text-blue-800"
                    : "hover:bg-blue-50 text-gray-700"
                )}
                onClick={() => onTabChange?.("institute")}
              >
                Institute
              </button>
              <button
                type="button"
                className={cn(
                  "px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition min-h-[36px] sm:min-h-0",
                  activeTab === "my"
                    ? "bg-blue-100 text-blue-800"
                    : "hover:bg-blue-50 text-gray-700"
                )}
                onClick={() => onTabChange?.("my")}
              >
                My Papers
              </button>
            </div>
          )}

          {/* Analytics and Finder Buttons: Only for campus/super admin */}
          {canShowAdminActions && (
            <>
              {/* Analytics Button */}
              <button
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white border border-blue-400 text-blue-700 rounded-lg shadow-sm hover:bg-blue-50 transition min-h-[40px] sm:min-h-0"
                onClick={() => onShowAnalytics?.()}
                title="Show Analytics"
                type="button"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium text-xs sm:text-sm max-[375px]:hidden">Analytics</span>
              </button>
              {/* Finder Button */}
              <button
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-400 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition min-h-[40px] sm:min-h-0"
                onClick={() => onFacultyFinderOpenChange?.(true)}
                title="Find Faculty/Admin"
                type="button"
              >
                <Search className="h-4 w-4" />
                <span className="font-medium text-xs sm:text-sm hidden min-[425px]:inline">Find</span>
              </button>
            </>
          )}
          {/* Any extra actions */}
          {actions}
        </div>
      </div>
    </div>
  );
}