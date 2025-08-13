import React, { useMemo } from "react";
import { Search, Filter, Users, Building2, Building, UserCheck, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/**
 * SuperUserFinder
 * Simplified finder for super admin to search any faculty or campus admin across all colleges/institutes/departments.
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
        const dept = (u.department || "").toLowerCase();
        const college = (u.college || "").toLowerCase();
        const institute = (u.institute || "").toLowerCase();
        return name.includes(term) || email.includes(term) || fid.includes(term) || 
               dept.includes(term) || college.includes(term) || institute.includes(term);
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

  // Get role badge variant
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'super_admin':
        return { variant: 'default', className: 'bg-red-600 text-white', icon: <Shield className="h-3 w-3" /> };
      case 'campus_admin':
        return { variant: 'secondary', className: 'bg-blue-600 text-white', icon: <Building2 className="h-3 w-3" /> };
      case 'faculty':
        return { variant: 'outline', className: 'bg-green-50 text-green-700 border-green-200', icon: <UserCheck className="h-3 w-3" /> };
      default:
        return { variant: 'outline', className: 'bg-gray-50 text-gray-600', icon: <Users className="h-3 w-3" /> };
    }
  };

  return (
    <Card className="bg-white border border-gray-200 rounded-xl">
      <CardContent className="p-4">
        {/* Filters row */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={userSearchTerm}
              onChange={(e) => onUserSearchTermChange?.(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search name, email, faculty ID, department..."
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
        </div>

        {/* Additional filters */}
        <div className="mb-4 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={userHasPubsOnly}
              onChange={(e) => onUserHasPubsOnlyChange?.(e.target.checked)}
              className="h-4 w-4"
            />
            With publications only
          </label>
          
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Filter className="h-4 w-4" />
            <span>Results: {filteredUsers.length}</span>
          </div>
        </div>

        {/* Simplified User List */}
        <div className="max-h-[60vh] overflow-auto space-y-2 pr-1" role="listbox" aria-label="Users list">
          {filteredUsers.map((u) => {
            const count = paperCountByFaculty.get(u.facultyId) || 0;
            const isSelected = selectedUserId === u.facultyId;
            const roleBadge = getRoleBadgeVariant(u.role);

            return (
              <button
                key={u._id}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelectUser?.(isSelected ? null : u)}
                className={cn(
                  "w-full text-left border rounded-lg p-3 hover:bg-blue-50/60 transition focus:outline-none focus:ring-2 focus:ring-blue-500",
                  isSelected ? "border-blue-300 bg-blue-50 shadow-md" : "border-gray-200 bg-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        "text-sm font-semibold truncate",
                        isSelected ? "text-blue-800" : "text-gray-900"
                      )}>
                        {u.fullName}
                      </h4>
                      
                      <Badge 
                        variant={roleBadge.variant}
                        className={cn("text-xs", roleBadge.className)}
                      >
                        {roleBadge.icon}
                        <span className="ml-1 capitalize">{u.role?.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Building className="h-3 w-3 text-gray-400" />
                      <span>{u.college}</span>
                      {u.institute && u.institute !== 'N/A' && (
                        <>
                          <span>•</span>
                          <span>{u.institute}</span>
                        </>
                      )}
                      {u.department && u.department !== 'N/A' && (
                        <>
                          <span>•</span>
                          <span>{u.department}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <span
                    className={cn(
                      "ml-3 shrink-0 text-sm px-3 py-1 rounded-full border font-medium",
                      count > 0 
                        ? "border-blue-200 bg-blue-50 text-blue-700" 
                        : "border-gray-200 bg-gray-50 text-gray-600"
                    )}
                    title={`${count} publication${count !== 1 ? 's' : ''}`}
                  >
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-sm">Try adjusting your search criteria or filters</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}