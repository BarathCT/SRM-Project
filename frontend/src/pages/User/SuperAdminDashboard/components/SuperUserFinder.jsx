import React from "react";
import { cn } from "@/lib/utils";
import { Search, X, Users, UserCheck, Shield, Building2, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const INITIAL_LIMIT = 10;

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
  colleges = [],
  institutesForFinder = [],
  departmentsForFinder = [],
  onSelectUser,
  selectedUserId,
  onClose,
}) {
  // Build publication counts for quick info
  const paperCountByFaculty = React.useMemo(() => {
    const map = new Map();
    for (const p of papersInScope || []) {
      if (!p?.facultyId) continue;
      map.set(p.facultyId, (map.get(p.facultyId) || 0) + 1);
    }
    return map;
  }, [papersInScope]);

  const filteredUsers = React.useMemo(() => {
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
        return (
          name.includes(term) ||
          email.includes(term) ||
          fid.includes(term) ||
          dept.includes(term) ||
          college.includes(term) ||
          institute.includes(term)
        );
      })
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
    paperCountByFaculty,
  ]);

  // Pagination/limit for users
  const [showLimit, setShowLimit] = React.useState(INITIAL_LIMIT);
  React.useEffect(() => {
    setShowLimit(INITIAL_LIMIT); // Reset limit on filter/search change
  }, [userSearchTerm, userRoleFilter, userCollegeFilter, userInstituteFilter, userDeptFilter, users]);

  const usersToShow = filteredUsers.slice(0, showLimit);

  // Get role badge variant
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "super_admin":
        return { variant: "default", className: "bg-red-600 text-white", icon: <Shield className="h-3 w-3" /> };
      case "campus_admin":
        return { variant: "secondary", className: "bg-blue-600 text-white", icon: <Building2 className="h-3 w-3" /> };
      case "faculty":
        return { variant: "outline", className: "bg-green-50 text-green-700 border-green-200", icon: <UserCheck className="h-3 w-3" /> };
      default:
        return { variant: "outline", className: "bg-gray-50 text-gray-600", icon: <Users className="h-3 w-3" /> };
    }
  };

  return (
    <div
      className="h-full flex flex-col p-5"
      style={{ boxSizing: "border-box" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          Find Faculty/Admin
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            value={userSearchTerm}
            onChange={(e) => onUserSearchTermChange?.(e.target.value)}
            placeholder="Search name, email, faculty ID..."
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select value={userRoleFilter} onValueChange={onUserRoleFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="campus_admin">Campus Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={userCollegeFilter}
            onValueChange={(value) => {
              onUserCollegeFilterChange?.(value);
              onUserInstituteFilterChange?.("all");
              onUserDeptFilterChange?.("all");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All colleges" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All colleges</SelectItem>
              {colleges.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={userInstituteFilter}
            onValueChange={(value) => {
              onUserInstituteFilterChange?.(value);
              onUserDeptFilterChange?.("all");
            }}
            disabled={userCollegeFilter === "all"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All institutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All institutes</SelectItem>
              {institutesForFinder.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={userDeptFilter}
            onValueChange={onUserDeptFilterChange}
            disabled={userCollegeFilter === "all" && userInstituteFilter === "all"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departmentsForFinder.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{filteredUsers.length}</span>
            <span>results</span>
          </div>
        </div>
      </div>

      {/* User List */}
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-2">
          {usersToShow.map((u) => {
            const count = paperCountByFaculty.get(u.facultyId) || 0;
            const isSelected = selectedUserId === u.facultyId;
            const roleBadge = getRoleBadgeVariant(u.role);

            return (
              <button
                key={u._id}
                onClick={() => onSelectUser?.(isSelected ? null : u)}
                className={cn(
                  "w-full text-left border rounded-lg p-3 hover:bg-blue-50/60 transition focus:outline-none focus:ring-2 focus:ring-blue-500",
                  isSelected
                    ? "border-blue-300 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={cn(
                          "text-sm font-semibold truncate",
                          isSelected ? "text-blue-800" : "text-gray-900"
                        )}
                      >
                        {u.fullName}
                      </h4>

                      <Badge
                        variant={roleBadge.variant}
                        className={cn("text-xs", roleBadge.className)}
                      >
                        {roleBadge.icon}
                        <span className="ml-1 capitalize">
                          {u.role?.replace("_", " ")}
                        </span>
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
                      {u.college && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-gray-400" />
                          {u.college}
                        </span>
                      )}
                      {u.institute && u.institute !== "N/A" && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          {u.institute}
                        </span>
                      )}
                      {u.department && u.department !== "N/A" && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-gray-400" />
                          {u.department}
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant={count > 0 ? "default" : "outline"}
                    className={cn(
                      "ml-3 shrink-0",
                      count > 0
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {count} pub{count !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </button>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <h3 className="font-medium text-gray-900 mb-1">
                No users found
              </h3>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}

          {/* Show More button */}
          {filteredUsers.length > showLimit && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => setShowLimit((l) => l + INITIAL_LIMIT)}
              >
                Show more
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}