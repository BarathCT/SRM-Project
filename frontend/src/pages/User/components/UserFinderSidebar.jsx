import React from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  X,
  Users,
  UserCheck,
  Shield,
  Building2,
  Building,
  Filter,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getInstitutesForCollege,
  getDepartments,
  collegesWithoutInstitutes,
  ALL_COLLEGE_NAMES,
} from "@/utils/collegeData";

const INITIAL_LIMIT = 15;

/**
 * UserFinderSidebar is FULLY DECOUPLED from publication filter state.
 * It manages only its own user filters, and receives a users prop
 * (with pubCount injected by parent).
 * The pubCount must be computed by the parent using ALL papers, not filtered ones.
 */
export default function UserFinderSidebar({
  open,
  onClose,
  users = [],
  papers = [], // This is now only used as fallback if users don't have pubCount
  selectedUserId,
  onSelectUser,
  searchTerm = "",
  onSearchTermChange,
  // Super admin filters
  roleFilter = "all",
  onRoleFilterChange,
  collegeFilter = "all",
  onCollegeFilterChange,
  instituteFilter = "all",
  onInstituteFilterChange,
  deptFilter = "all",
  onDeptFilterChange,
  // Campus admin context
  campusCollege,
  campusInstitute,
  context = "campus", // "campus" or "super"
  loading = false,
  title = "Find Faculty/Admin",
}) {
  // Lock body scroll when sidebar is open
  React.useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // Fallback publication count per user (only used if users prop doesn't have pubCount)
  const paperCountByUser = React.useMemo(() => {
    const map = new Map();
    for (const p of papers) {
      if (p?.facultyId) map.set(p.facultyId, (map.get(p.facultyId) || 0) + 1);
    }
    return map;
  }, [papers]);

  // Super admin: dynamic options
  const collegeOptions = React.useMemo(() => ALL_COLLEGE_NAMES, []);
  const instituteOptions = React.useMemo(() => {
    if (context === "super" && collegeFilter !== "all") {
      return getInstitutesForCollege(collegeFilter);
    }
    if (context === "campus") {
      return getInstitutesForCollege(campusCollege);
    }
    return [];
  }, [context, collegeFilter, campusCollege]);
  const departmentOptions = React.useMemo(() => {
    if (context === "super" && collegeFilter !== "all" && instituteFilter !== "all") {
      return getDepartments(collegeFilter, instituteFilter);
    }
    if (context === "super" && collegeFilter !== "all" && collegesWithoutInstitutes.includes(collegeFilter)) {
      // Colleges without institutes
      return getDepartments(collegeFilter, null);
    }
    if (context === "campus") {
      return getDepartments(campusCollege, campusInstitute);
    }
    return [];
  }, [context, collegeFilter, instituteFilter, campusCollege, campusInstitute]);

  // Filtering logic: filter users only by sidebar filters (not pub filter)
  const filteredUsers = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let filtered = users;
    if (context === "super") {
      if (roleFilter && roleFilter !== "all") filtered = filtered.filter((u) => u.role === roleFilter);
      if (collegeFilter && collegeFilter !== "all") filtered = filtered.filter((u) => u.college === collegeFilter);
      // Institute only applies if college has institutes and not "all"
      if (
        collegeFilter !== "all" &&
        !collegesWithoutInstitutes.includes(collegeFilter) &&
        instituteFilter !== "all"
      ) {
        filtered = filtered.filter((u) => u.institute === instituteFilter);
      }
      // Department filter applies if set, and correct context
      if (deptFilter && deptFilter !== "all") filtered = filtered.filter((u) => u.department === deptFilter);
    } else {
      filtered = filtered.filter((u) => u.college === campusCollege && u.institute === campusInstitute);
      if (deptFilter && deptFilter !== "all") filtered = filtered.filter((u) => u.department === deptFilter);
    }

    // Search term
    filtered = filtered.filter((u) => {
      if (!term) return true;
      return (
        (u.fullName || "").toLowerCase().includes(term) ||
        (u.email || "").toLowerCase().includes(term) ||
        (u.facultyId || "").toLowerCase().includes(term) ||
        (u.department || "").toLowerCase().includes(term) ||
        (u.college || "").toLowerCase().includes(term) ||
        (u.institute || "").toLowerCase().includes(term)
      );
    });

    // Sort: by pub count desc, then name asc
    filtered = filtered.sort((a, b) => {
      // Use the pubCount property (should be injected by parent)
      // Fallback to paperCountByUser only if pubCount isn't provided
      const ap = typeof a.pubCount === "number" ? a.pubCount : (paperCountByUser.get(a.facultyId) || 0);
      const bp = typeof b.pubCount === "number" ? b.pubCount : (paperCountByUser.get(b.facultyId) || 0);
      if (bp !== ap) return bp - ap;
      return (a.fullName || "").localeCompare(b.fullName || "");
    });
    return filtered;
  }, [
    users,
    searchTerm,
    roleFilter,
    collegeFilter,
    instituteFilter,
    deptFilter,
    context,
    campusCollege,
    campusInstitute,
    paperCountByUser, // Only used as fallback
  ]);

  // Paging
  const [showLimit, setShowLimit] = React.useState(INITIAL_LIMIT);
  React.useEffect(() => {
    setShowLimit(INITIAL_LIMIT);
  }, [
    searchTerm,
    roleFilter,
    collegeFilter,
    instituteFilter,
    deptFilter,
    context,
    campusCollege,
    campusInstitute,
    open,
  ]);
  const usersToShow = filteredUsers.slice(0, showLimit);

  // Role badge
  function roleBadge(role) {
    switch (role) {
      case "super_admin":
        return (
          <Badge className="bg-red-600 text-white flex items-center gap-1" variant="default">
            <Shield className="h-3 w-3" />
            Super Admin
          </Badge>
        );
      case "campus_admin":
        return (
          <Badge className="bg-blue-600 text-white flex items-center gap-1" variant="secondary">
            <Building2 className="h-3 w-3" />
            Campus Admin
          </Badge>
        );
      case "faculty":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1" variant="outline">
            <UserCheck className="h-3 w-3" />
            Faculty
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-50 text-gray-600 flex items-center gap-1" variant="outline">
            <Users className="h-3 w-3" />
            {role}
          </Badge>
        );
    }
  }

  // Keyboard trap for accessibility
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onDown);
    return () => window.removeEventListener("keydown", onDown);
  }, [open, onClose]);

  // Reset/Clear filter handler
  function handleClearFilters() {
    if (context === "super") {
      onSearchTermChange?.("");
      onRoleFilterChange?.("all");
      onCollegeFilterChange?.("all");
      onInstituteFilterChange?.("all");
      onDeptFilterChange?.("all");
    } else {
      onSearchTermChange?.("");
      onDeptFilterChange?.("all");
    }
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/30 transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-blue-100 flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
        aria-modal="true"
        role="dialog"
        tabIndex={0}
        style={{ maxWidth: 420 }}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        {/* Filters */}
        <div className="p-6 pt-4 pb-2 space-y-3 border-b border-blue-50 bg-gradient-to-b from-white to-blue-50/10">
          <div className="flex items-center gap-2">
            <Input
              type="search"
              value={searchTerm}
              onChange={(e) => onSearchTermChange?.(e.target.value)}
              placeholder="Search by name, email, ID…"
              disabled={loading}
              className="pl-9"
              autoFocus
            />
            <Badge
              variant="secondary"
              className="flex items-center gap-1 h-8 px-3 text-base font-semibold"
            >
              <Filter className="h-4 w-4 mr-1" />
              {filteredUsers.length}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleClearFilters}
              title="Reset filters"
              className="ml-1"
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {context === "super" && (
              <Select value={roleFilter} onValueChange={onRoleFilterChange} disabled={loading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="campus_admin">Campus Admin</SelectItem>
                </SelectContent>
              </Select>
            )}
            {context === "super" && (
              <Select
                value={collegeFilter}
                onValueChange={(v) => {
                  onCollegeFilterChange?.(v);
                  onInstituteFilterChange?.("all");
                  onDeptFilterChange?.("all");
                }}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All colleges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All colleges</SelectItem>
                  {collegeOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {/* Show institute if college is selected and not a "no institutes" college */}
            {context === "super" &&
              collegeFilter !== "all" &&
              !collegesWithoutInstitutes.includes(collegeFilter) && (
                <Select
                  value={instituteFilter}
                  onValueChange={(v) => {
                    onInstituteFilterChange?.(v);
                    onDeptFilterChange?.("all");
                  }}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All institutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All institutes</SelectItem>
                    {instituteOptions.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            {/* Show department if context or super with valid college/institute */}
            <Select
              value={deptFilter}
              onValueChange={onDeptFilterChange}
              disabled={loading || departmentOptions.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departmentOptions.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 animate-pulse">
              <Users className="h-8 w-8 mr-2" />
              <span className="text-lg">Loading users…</span>
            </div>
          ) : (
            <div className="space-y-2">
              {usersToShow.map((user) => {
                // Use the pubCount property (should be injected by parent)
                // Fallback to paperCountByUser only if pubCount isn't provided
                const count =
                  typeof user.pubCount === "number"
                    ? user.pubCount
                    : (paperCountByUser.get(user.facultyId) || 0);
                const isSelected = selectedUserId === user.facultyId;
                return (
                  <button
                    key={user._id || user.facultyId}
                    onClick={() => onSelectUser?.(isSelected ? null : user)}
                    className={cn(
                      "w-full text-left border rounded-lg p-3 hover:bg-blue-50/80 transition focus:outline-none focus:ring-2 focus:ring-blue-500",
                      isSelected
                        ? "border-blue-400 bg-blue-50 shadow"
                        : "border-gray-200 bg-white"
                    )}
                    aria-current={isSelected}
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
                            {user.fullName}
                          </h4>
                          {roleBadge(user.role)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
                          {user.college && (
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3 text-gray-400" />
                              {user.college}
                            </span>
                          )}
                          {user.institute && user.institute !== "N/A" && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-gray-400" />
                              {user.institute}
                            </span>
                          )}
                          {user.department && user.department !== "N/A" && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-gray-400" />
                              {user.department}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* <Badge
                        variant={count > 0 ? "default" : "outline"}
                        className={cn(
                          "ml-3 shrink-0",
                          count > 0
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {count} pub{count !== 1 ? "s" : ""}
                      </Badge> */}
                    </div>
                  </button>
                );
              })}
              {!loading && filteredUsers.length === 0 && (
                <div className="text-center pt-8 pb-4 text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-gray-600 mb-1">
                    No users found
                  </div>
                  <div className="text-xs text-gray-500">
                    Try adjusting search or filters.
                  </div>
                </div>
              )}
              {filteredUsers.length > showLimit && (
                <div className="flex justify-center pt-3">
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
          )}
        </div>
      </aside>
    </>
  );
}