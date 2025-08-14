import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  GraduationCap, 
  Users, 
  Clock, 
  Search, 
  Building, 
  X,
  UserCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardHeader({
  title,
  subtitle,
  userName,
  dateTime,
  actions,
  icon,
  className,
  
  // Tab switching
  showTabSwitch = false,
  activeTab = "institute",
  onTabChange,
  
  // Faculty selection (campus admin only)
  showFacultySelector = false,
  users = [],
  institutePapers = [],
  selectedFacultyId,
  onSelectFaculty,

  // NEW: Open/close the dedicated Faculty Finder panel
  facultyFinderOpen = false,
  onFacultyFinderOpenChange,

  // Faculty filters
  facultySearchTerm = "",
  onFacultySearchChange,
  facultyDeptFilter = "all",
  onFacultyDeptChange,
  facultyHasPubsOnly = false,
  onFacultyHasPubsOnlyChange,
  departments = [],
}) {
  const [/* unused state removed to avoid dropdown usage */] = useState();

  // Faculty data processing
  const paperCountByFaculty = useMemo(() => {
    const map = {};
    for (const p of institutePapers || []) {
      if (!p?.facultyId) continue;
      map[p.facultyId] = (map[p.facultyId] || 0) + 1;
    }
    return map;
  }, [institutePapers]);

  const filteredFaculty = useMemo(() => {
    const term = facultySearchTerm.trim().toLowerCase();
    return (users || [])
      .filter(u => facultyDeptFilter === "all" || u.department === facultyDeptFilter)
      .filter(u => {
        if (!term) return true;
        const name = (u.fullName || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const dept = (u.department || "").toLowerCase();
        return name.includes(term) || email.includes(term) || dept.includes(term);
      })
      .filter(u => facultyHasPubsOnly ? (paperCountByFaculty[u.facultyId] || 0) > 0 : true)
      .sort((a, b) => {
        const ap = paperCountByFaculty[a.facultyId] || 0;
        const bp = paperCountByFaculty[b.facultyId] || 0;
        if (ap !== bp) return bp - ap;
        return (a.fullName || "").localeCompare(b.fullName || "");
      });
  }, [users, facultyDeptFilter, facultySearchTerm, facultyHasPubsOnly, paperCountByFaculty]);

  const selectedFaculty = useMemo(() => 
    selectedFacultyId ? users.find(u => u.facultyId === selectedFacultyId) : null,
    [users, selectedFacultyId]
  );

  const handleTabChange = (value) => {
    if (value === activeTab) return;
    onTabChange?.(value);
  };

  const handleFacultySelect = (facultyId) => {
    onSelectFaculty?.(facultyId);
    // Keep the finder open so user can switch, or close by preference:
    // onFacultyFinderOpenChange?.(false);
  };

  const clearFacultySelection = () => {
    onSelectFaculty?.(null);
    // Do not force-close the panel; user can close via the button
  };

  return (
    <div className={cn("mb-8  border-blue-100 pb-6 bg-gradient-to-r from-white-50/50 to-white", className)}>
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

        {/* Right: Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Faculty Finder trigger + selected chip */}
          {showFacultySelector && activeTab === "institute" && (
            <div className="flex items-center gap-2">
              {selectedFaculty && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {selectedFaculty.fullName}
                  </span>
                  <button
                    onClick={clearFacultySelection}
                    className="ml-1 p-0.5 hover:bg-blue-200 rounded"
                    aria-label="Clear selected faculty"
                    title="Clear selected faculty"
                  >
                    <X className="h-3 w-3 text-blue-600" />
                  </button>
                </div>
              )}

              <button
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                aria-controls="faculty-finder-panel"
                aria-expanded={facultyFinderOpen}
                onClick={() => onFacultyFinderOpenChange?.(!facultyFinderOpen)}
                title="Find Faculty"
              >
                <Search className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {facultyFinderOpen ? "Hide Finder" : "Find Faculty"}
                </span>
              </button>
            </div>
          )}

          {/* Tab Switch */}
          {showTabSwitch && (
            <div className="inline-flex rounded-xl bg-white border border-gray-200 p-1 shadow-sm">
              <button
                onClick={() => handleTabChange("institute")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  activeTab === "institute"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Building className="h-4 w-4 mr-2 inline" />
                Institute
              </button>
              <button
                onClick={() => handleTabChange("my")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  activeTab === "my"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <UserCheck className="h-4 w-4 mr-2 inline" />
                My Publications
              </button>
            </div>
          )}

          {/* Additional Actions */}
          {actions}
        </div>
      </div>
    </div>
  );
}