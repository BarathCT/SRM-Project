import React, { useMemo, useId, useState, useEffect, memo } from "react";
import { Search, Users, ChevronsLeft, Filter, ListFilter } from "lucide-react";

/**
 * Small debounce hook to avoid filtering on every keystroke.
 */
function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const FacultySidebar = ({
  users,
  institutePapers,
  departments = [],
  selectedFacultyId,
  onSelect,

  // Filters
  userSearchTerm,
  onUserSearchTermChange,
  userDeptFilter,
  onUserDeptFilterChange,
  userHasPubsOnly,
  onUserHasPubsOnlyChange,

  // Optional: desktop collapse control
  onCollapse,

  // Optional: loading state
  loading = false,
}) => {
  const searchInputId = useId();
  const deptSelectId = useId();
  const pubsOnlyId = useId();

  const debouncedSearch = useDebouncedValue(userSearchTerm, 200);

  // Build a Map for O(1) lookup of publication counts
  const paperCountByFaculty = useMemo(() => {
    const map = new Map();
    for (const p of institutePapers || []) {
      if (!p?.facultyId) continue;
      map.set(p.facultyId, (map.get(p.facultyId) || 0) + 1);
    }
    return map;
  }, [institutePapers]);

  // Precompute lowercase search once
  const term = (debouncedSearch || "").trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    const out = [];

    for (const u of list) {
      if (userDeptFilter !== "all" && u.department !== userDeptFilter) continue;

      if (term) {
        const name = (u.fullName || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const dept = (u.department || "").toLowerCase();
        if (!name.includes(term) && !email.includes(term) && !dept.includes(term)) continue;
      }

      const count = paperCountByFaculty.get(u.facultyId) || 0;
      if (userHasPubsOnly && count === 0) continue;

      out.push(u);
    }

    // Sort by pubs desc, then name
    out.sort((a, b) => {
      const ap = paperCountByFaculty.get(a.facultyId) || 0;
      const bp = paperCountByFaculty.get(b.facultyId) || 0;
      if (ap !== bp) return bp - ap;
      return (a.fullName || "").localeCompare(b.fullName || "");
    });

    return out;
  }, [users, userDeptFilter, term, userHasPubsOnly, paperCountByFaculty]);

  const totalFaculty = users?.length || 0;
  const filteredCount = filteredUsers.length;

  return (
    <aside className="bg-white border border-gray-200 rounded-xl p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Faculty</h3>
          <span className="ml-1 text-xs text-gray-500">
            {loading ? "Loading…" : `${filteredCount}/${totalFaculty}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedFacultyId && (
            <button
              onClick={() => onSelect(null)}
              className="text-xs text-blue-700 hover:underline"
              title="Clear selected faculty"
            >
              Clear
            </button>
          )}
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="hidden lg:inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
              title="Collapse sidebar"
            >
              <ChevronsLeft className="h-4 w-4" />
              Collapse
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <label htmlFor={searchInputId} className="sr-only">
          Search faculty
        </label>
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          id={searchInputId}
          type="search"
          placeholder="Search name, email, or department"
          value={userSearchTerm}
          onChange={(e) => onUserSearchTermChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search faculty by name, email, or department"
        />
      </div>

      {/* Filters */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <ListFilter className="h-4 w-4" />
          Filters
        </div>
      </div>

      {/* Department filter */}
      <div className="mb-3">
        <label htmlFor={deptSelectId} className="text-xs text-gray-600 mb-1 block">
          Department
        </label>
        <select
          id={deptSelectId}
          value={userDeptFilter}
          onChange={(e) => onUserDeptFilterChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Has publications only */}
      <label
        htmlFor={pubsOnlyId}
        className="flex items-center gap-2 text-sm text-gray-700 mb-3 cursor-pointer select-none"
      >
        <input
          id={pubsOnlyId}
          type="checkbox"
          checked={userHasPubsOnly}
          onChange={(e) => onUserHasPubsOnlyChange(e.target.checked)}
          className="h-4 w-4"
        />
        Show only faculty with publications
      </label>

      {/* List */}
      <div
        className="mt-2 space-y-1 max-h-[60vh] overflow-auto pr-1"
        role="listbox"
        aria-label="Faculty list"
      >
        {loading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-3">
                <div className="h-3 w-1/2 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-1/3 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading &&
          filteredUsers.map((u) => {
            const count = paperCountByFaculty.get(u.facultyId) || 0;
            const isSelected = selectedFacultyId === u.facultyId;

            return (
              <button
                key={u.facultyId}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(isSelected ? null : u.facultyId)}
                className={[
                  "w-full text-left border rounded-lg px-3 py-2 hover:bg-blue-50/60 transition focus:outline-none focus:ring-2 focus:ring-blue-500",
                  isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white",
                ].join(" ")}
                title={`${u.fullName}${u.department ? ` • ${u.department}` : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p
                      className={[
                        "text-sm font-medium truncate",
                        isSelected ? "text-blue-800" : "text-gray-900",
                      ].join(" ")}
                    >
                      {u.fullName}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{u.department || "—"}</p>
                  </div>
                  <span
                    className={[
                      "ml-2 shrink-0 text-xs px-2 py-0.5 rounded-full border",
                      count > 0
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-gray-50 text-gray-600",
                    ].join(" ")}
                    aria-label={`${count} publication${count === 1 ? "" : "s"}`}
                  >
                    {count}
                  </span>
                </div>
              </button>
            );
          })}

        {!loading && !filteredUsers.length && (
          <div className="text-xs text-gray-500 py-6 text-center">
            No faculty found
            {term || userHasPubsOnly || userDeptFilter !== "all" ? (
              <div className="mt-1">
                Try clearing filters
                <Filter className="inline-block h-3.5 w-3.5 ml-1 text-gray-400 align-text-bottom" />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
};

export default memo(FacultySidebar);