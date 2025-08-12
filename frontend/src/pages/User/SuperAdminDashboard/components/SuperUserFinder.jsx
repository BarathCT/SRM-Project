import React, { useMemo } from "react";
import { Search, Filter, Users, Building2, Building } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SuperUserFinder
 * Finder for super admin to search any faculty or campus admin across all colleges/institutes/departments.
 *
 * Props:
 * - users: all users array
 * - papersInScope: papers array used to compute "has publications" (optional; if empty, counts will appear as 0)
 * - userSearchTerm, onUserSearchTermChange
 * - userRoleFilter, onUserRoleFilterChange ("all" | "faculty" | "campus_admin")
 * - userCollegeFilter, onUserCollegeFilterChange
 * - userInstituteFilter, onUserInstituteFilterChange
 * - userDeptFilter, onUserDeptFilterChange
 * - userHasPubsOnly, onUserHasPubsOnlyChange
 * - colleges: string[]
 * - institutesForFinder: string[] (based on current college filter)
 * - departmentsForFinder: string[] (based on current college + institute filters)
 * - onSelectUser: (user) => void
 * - selectedUserId: string | null (facultyId)
 */
export default function SuperUserFinder({
  users,
  papersInScope = [],
  userSearchTerm,
  onUserSearchTermChange,
  userRoleFilter = "all",
  onUserRoleFilterChange,
  userCollegeFilter = "all",
  onUserCollegeFilterChange,
  userInstituteFilter = "all",
  onUserInstituteFilterChange,
  userDeptFilter = "all",
  onUserDeptFilterChange,
  userHasPubsOnly = false,
  onUserHasPubsOnlyChange,
  colleges = [],
  institutesForFinder = [],
  departmentsForFinder = [],
  onSelectUser,
  selectedUserId,
}) {
  // Build publication counts for quick info
  const paperCountByFaculty = useMemo(() => {
    const map = new Map();
    for (const p of papersInScope || []) {
      if (!p?.facultyId) continue;
      map.set(p.facultyId, (map.get(p.facultyId) || 0) + 1);
    }
    return map;
  }, [papersInScope]);

  const filteredUsers = useMemo(() => {
    const term = (userSearchTerm || "").trim().toLowerCase();
    return (users || [])
      .filter((u) => userRoleFilter === "all" || u.role === userRoleFilter)
      .filter((u) => userCollegeFilter === "all" || u.college === userCollegeFilter)
      .filter((u) => userInstituteFilter === "all" || u.institute === userInstituteFilter)
      .filter((u) => userDeptFilter === "all" || u.department === userDeptFilter)
      .filter((u) => {
        if (!term) return true;
        const name = (u.fullName || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const fid = (u.facultyId || "").toLowerCase();
        return name.includes(term) || email.includes(term) || fid.includes(term);
      })
      .filter((u) => (userHasPubsOnly ? (paperCountByFaculty.get(u.facultyId) || 0) > 0 : true))
      .sort((a, b) => {
        const ap = paperCountByFaculty.get(a.facultyId) || 0;
        const bp = paperCountByFaculty.get(b.facultyId) || 0;
        if (bp !== ap) return bp - ap;
        return (a.fullName || "").localeCompare(b.fullName || "");
      });
  }, [
    users,
    userRoleFilter,
    userCollegeFilter,
    userInstituteFilter,
    userDeptFilter,
    userSearchTerm,
    userHasPubsOnly,
    paperCountByFaculty,
  ]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      {/* Filters row */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={userSearchTerm}
            onChange={(e) => onUserSearchTermChange?.(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search name, email, or faculty ID"
          />
        </div>

        <select
          value={userRoleFilter}
          onChange={(e) => onUserRoleFilterChange?.(e.target.value)}
          className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          title="Role"
        >
          <option value="all">All roles</option>
          <option value="faculty">Faculty</option>
          <option value="campus_admin">Campus Admin</option>
        </select>

        <select
          value={userCollegeFilter}
          onChange={(e) => {
            onUserCollegeFilterChange?.(e.target.value);
            onUserInstituteFilterChange?.("all");
            onUserDeptFilterChange?.("all");
          }}
          className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          title="College"
        >
          <option value="all">All colleges</option>
          {colleges.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={userInstituteFilter}
          onChange={(e) => {
            onUserInstituteFilterChange?.(e.target.value);
            onUserDeptFilterChange?.("all");
          }}
          className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          title="Institute"
          disabled={userCollegeFilter === "all"}
        >
          <option value="all">All institutes</option>
          {institutesForFinder.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>

        <select
          value={userDeptFilter}
          onChange={(e) => onUserDeptFilterChange?.(e.target.value)}
          className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          title="Department"
          disabled={userCollegeFilter === "all" && userInstituteFilter === "all"}
        >
          <option value="all">All departments</option>
          {departmentsForFinder.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={userHasPubsOnly}
            onChange={(e) => onUserHasPubsOnlyChange?.(e.target.checked)}
            className="h-4 w-4"
          />
          With publications
        </label>
      </div>

      {/* Header line */}
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
        <Filter className="h-4 w-4" />
        <span>Results: {filteredUsers.length}</span>
      </div>

      {/* List */}
      <div className="max-h-[50vh] overflow-auto space-y-2 pr-1" role="listbox" aria-label="Users list">
        {filteredUsers.map((u) => {
          const count = paperCountByFaculty.get(u.facultyId) || 0;
          const isSelected = selectedUserId === u.facultyId;
          return (
            <button
              key={u._id}
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelectUser?.(isSelected ? null : u)}
              className={cn(
                "w-full text-left border rounded-lg px-3 py-2 hover:bg-blue-50/60 transition focus:outline-none focus:ring-2 focus:ring-blue-500",
                isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
              )}
              title={`${u.fullName} • ${u.role}`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className={cn("text-sm font-medium truncate", isSelected ? "text-blue-800" : "text-gray-900")}>
                    {u.fullName}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {u.role === "campus_admin" ? (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Campus Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Faculty
                      </span>
                    )}
                    {" • "}
                    {u.college} {u.institute !== "N/A" ? `• ${u.institute}` : ""} {u.department ? `• ${u.department}` : ""}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">{u.email}</p>
                </div>
                <span
                  className={cn(
                    "ml-2 shrink-0 text-xs px-2 py-0.5 rounded-full border",
                    count > 0 ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-600"
                  )}
                  title={`${count} publications`}
                >
                  {count}
                </span>
              </div>
            </button>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="text-xs text-gray-500 py-6 text-center">
            No users found. Adjust filters above.
          </div>
        )}
      </div>
    </div>
  );
}