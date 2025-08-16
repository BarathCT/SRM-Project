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
}) {
  return (
    <div className={cn("mb-8 border-blue-100 pb-6 bg-gradient-to-r from-white-50/50 to-white", className)}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Title and meta */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
              {icon || <GraduationCap className="h-6 w-6" />}
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-gray-600 text-sm mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          {(userName || dateTime) && (
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              {userName && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-700">{userName}</span>
                </div>
              )}
              {dateTime && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{dateTime}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Tab Switcher (for campus admin etc.) */}
          {showTabSwitch && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white border border-blue-100 rounded-lg shadow-sm">
              <button
                type="button"
                className={cn(
                  "px-3 py-1 rounded-md text-sm font-medium transition",
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
                  "px-3 py-1 rounded-md text-sm font-medium transition",
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

          {/* Analytics Button */}
          <button
            className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-400 text-blue-700 rounded-lg shadow-sm hover:bg-blue-50 transition"
            onClick={() => onShowAnalytics?.()}
            title="Show Analytics"
            type="button"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="font-medium text-sm">Analytics</span>
          </button>
          {/* Finder Button */}
          <button
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-400 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition"
            onClick={() => onFacultyFinderOpenChange?.(true)}
            title="Find Faculty/Admin"
            type="button"
          >
            <Search className="h-4 w-4" />
            <span className="font-medium text-sm">Find Faculty/Admin</span>
          </button>
          {/* Any extra actions */}
          {actions}
        </div>
      </div>
    </div>
  );
}