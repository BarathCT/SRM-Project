import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Filter, X, Search, Building, User as UserIcon, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useMemo } from 'react';
import {
  collegesWithoutInstitutes,
  collegeOptions,
  getDepartments,
  getAllDepartmentNames,
  getInstitutesForCollege,
} from '@/utils/collegeData';

export default function UserFilters({
  filters,
  setFilters,
  searchTerm,
  setSearchTerm,
  availableRoles,
  availableInstitutes,
  availableColleges,
  availableDepartments,
  currentUser,
  resetFilters,
}) {
  const isCampusAdmin = currentUser?.role === 'campus_admin';

  // --- Department dropdown options logic for campus admin ---
  let campusAdminDepartments = [];
  if (isCampusAdmin) {
    if (collegesWithoutInstitutes.includes(currentUser.college)) {
      // Without institute: show all college departments
      campusAdminDepartments = getDepartments(currentUser.college);
    } else if (currentUser.college && currentUser.institute) {
      // With institute: show only their institute's departments
      campusAdminDepartments = getDepartments(currentUser.college, currentUser.institute);
    }
  }

  // --- Role dropdown options logic ---
  const roleDropdownOptions = isCampusAdmin
    ? [
        { value: 'all', label: 'All roles' },
        { value: 'campus_admin', label: 'Campus Admin' },
        { value: 'faculty', label: 'Faculty' },
      ]
    : [
        { value: 'all', label: 'All roles' },
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'campus_admin', label: 'Campus Admin' },
        { value: 'faculty', label: 'Faculty' },
      ];

  // --- Filter visibility logic ---
  const shouldShowCollegeFilter = currentUser?.role === 'super_admin';
  // Don't show institute for campus admin
  const shouldShowInstituteFilter = !isCampusAdmin &&
    availableInstitutes &&
    availableInstitutes.length > 0;
  const shouldShowDepartmentFilter = true;

  // --- Active filter logic ---
  const hasActiveFilters =
    filters.role !== 'all' ||
    (!isCampusAdmin && filters.institute !== 'all') ||
    (!isCampusAdmin && filters.college !== 'all') ||
    filters.department !== 'all' ||
    searchTerm;

  const activeFilterCount = [
    filters.role !== 'all',
    (!isCampusAdmin && filters.institute !== 'all'),
    (!isCampusAdmin && filters.college !== 'all'),
    filters.department !== 'all',
    !!searchTerm,
  ].filter(Boolean).length;

  // --- Dynamic filter options for non-campus admin ---
  const dynamicFilterOptions = useMemo(() => {
    let colleges = availableColleges?.filter(c => c !== 'N/A') || [];
    let institutes = availableInstitutes || [];
    let departments = availableDepartments || getAllDepartmentNames();
    return {
      colleges,
      institutes,
      departments,
    };
  }, [availableColleges, availableInstitutes, availableDepartments]);

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-4">
        <div className="flex items-center gap-2 sm:space-x-2">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
          <h3 className="font-medium text-sm sm:text-base">Filters</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="px-2 py-0.5 text-xs">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-gray-500 hover:text-gray-700 h-9 sm:h-8 px-3 text-xs sm:text-sm self-start sm:self-auto w-full sm:w-auto"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-1" />
            <span className="hidden sm:inline">Clear all</span>
            <span className="sm:hidden">Clear Filters</span>
          </Button>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Search Input - Full Width */}
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="search" className="flex items-center text-xs sm:text-sm font-medium">
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-gray-500 shrink-0" />
            Search
          </Label>
          <Input
            id="search"
            placeholder="Name, email, or faculty ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 sm:h-10 text-sm"
          />
        </div>

        {/* College and Role - Single Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* College filter (only for super admin) */}
          {shouldShowCollegeFilter && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="filter-college" className="flex items-center text-xs sm:text-sm font-medium">
                <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-gray-500 shrink-0" />
                College
              </Label>
              <Select
                value={filters.college}
                onValueChange={(value) => {
                  setFilters({ 
                    ...filters, 
                    college: value,
                    institute: 'all', // Reset institute when college changes
                    department: 'all' // Reset department when college changes
                  });
                }}
              >
                <SelectTrigger className="h-10 sm:h-10 text-sm">
                  <SelectValue placeholder="All colleges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All colleges</SelectItem>
                  {dynamicFilterOptions.colleges.map(college => (
                    <SelectItem key={college} value={college}>
                      {college}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Role filter */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="filter-role" className="flex items-center text-xs sm:text-sm font-medium">
              <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-gray-500 shrink-0" />
              Role
            </Label>
            <Select
              value={filters.role}
              onValueChange={(value) => setFilters({ ...filters, role: value })}
            >
              <SelectTrigger className="h-10 sm:h-10 text-sm">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                {roleDropdownOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Institute filter: only show when college is selected and has institutes */}
        {shouldShowInstituteFilter && filters.college !== 'all' && !collegesWithoutInstitutes.includes(filters.college) && (
          <div className="space-y-1.5 sm:space-y-2 w-full">
            <Label htmlFor="filter-institute" className="flex items-center text-xs sm:text-sm font-medium">
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-gray-500 shrink-0" />
              Institute
            </Label>
            <Select
              value={filters.institute}
              onValueChange={(value) => {
                setFilters({ 
                  ...filters, 
                  institute: value,
                  department: value === 'all' ? 'all' : filters.department
                });
              }}
            >
              <SelectTrigger className="h-10 sm:h-10 text-sm">
                <SelectValue placeholder="All institutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All institutes</SelectItem>
                {getInstitutesForCollege(filters.college)
                  .filter(institute => institute && institute !== 'N/A')
                  .map(institute => (
                    <SelectItem key={institute} value={institute}>
                      {institute}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Department filter: only show when appropriate conditions are met */}
        {(() => {
          // For campus admin: always show if they have departments
          if (isCampusAdmin) {
            if (campusAdminDepartments.length === 0) return null;
            return (
              <div className="space-y-1.5 sm:space-y-2 w-full">
                <Label htmlFor="filter-department" className="flex items-center text-xs sm:text-sm font-medium">
                  <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-gray-500 shrink-0" />
                  Department
                </Label>
                <Select
                  value={filters.department}
                  onValueChange={(value) => setFilters({ ...filters, department: value })}
                >
                  <SelectTrigger className="h-10 sm:h-10 text-sm">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {campusAdminDepartments
                      .filter(department => department && department !== 'N/A')
                      .map(department => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }
          // For super admin: show when college is selected
          if (filters.college === 'all') return null;
          // If college has no institutes, show departments directly
          if (collegesWithoutInstitutes.includes(filters.college)) {
            const depts = getDepartments(filters.college, null).filter(d => d && d !== 'N/A');
            if (depts.length === 0) return null;
            return (
              <div className="space-y-1.5 sm:space-y-2 w-full">
                <Label htmlFor="filter-department" className="flex items-center text-xs sm:text-sm font-medium">
                  <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-gray-500 shrink-0" />
                  Department
                </Label>
                <Select
                  value={filters.department}
                  onValueChange={(value) => setFilters({ ...filters, department: value })}
                >
                  <SelectTrigger className="h-10 sm:h-10 text-sm">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {depts.map(department => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }
          // If college has institutes, show departments only when institute is selected
          if (filters.institute === 'all') return null;
          const depts = getDepartments(filters.college, filters.institute).filter(d => d && d !== 'N/A');
          if (depts.length === 0) return null;
          return (
            <div className="space-y-1.5 sm:space-y-2 w-full">
              <Label htmlFor="filter-department" className="flex items-center text-xs sm:text-sm font-medium">
                <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-gray-500 shrink-0" />
                Department
              </Label>
              <Select
                value={filters.department}
                onValueChange={(value) => setFilters({ ...filters, department: value })}
              >
                <SelectTrigger className="h-10 sm:h-10 text-sm">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {depts.map(department => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })()}
      </div>

      {/* Active filters display - Mobile Optimized */}
      {hasActiveFilters && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1.5 w-full sm:w-auto mb-1 sm:mb-0">
              <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Active:
            </span>
            {filters.role !== 'all' && (
              <Badge variant="outline" className="px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs h-7 sm:h-6 flex items-center gap-1.5">
                <span className="hidden sm:inline">Role: </span>
                <span className="sm:hidden">R: </span>
                {filters.role.charAt(0).toUpperCase() + filters.role.slice(1).replace('_', ' ')}
                <button 
                  onClick={() => setFilters({ ...filters, role: 'all' })}
                  className="ml-0.5 sm:ml-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 transition-colors"
                  aria-label="Remove role filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.college !== 'all' && !isCampusAdmin && (
              <Badge variant="outline" className="px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs h-7 sm:h-6 flex items-center gap-1.5 max-w-full">
                <span className="hidden sm:inline">College: </span>
                <span className="sm:hidden">C: </span>
                <span className="truncate max-w-[120px] sm:max-w-none">{filters.college}</span>
                <button 
                  onClick={() => setFilters({ ...filters, college: 'all' })}
                  className="ml-0.5 sm:ml-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 transition-colors shrink-0"
                  aria-label="Remove college filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.institute !== 'all' && !isCampusAdmin && (
              <Badge variant="outline" className="px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs h-7 sm:h-6 flex items-center gap-1.5 max-w-full">
                <span className="hidden sm:inline">Institute: </span>
                <span className="sm:hidden">I: </span>
                <span className="truncate max-w-[120px] sm:max-w-none">{filters.institute}</span>
                <button 
                  onClick={() => setFilters({ ...filters, institute: 'all' })}
                  className="ml-0.5 sm:ml-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 transition-colors shrink-0"
                  aria-label="Remove institute filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.department !== 'all' && (
              <Badge variant="outline" className="px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs h-7 sm:h-6 flex items-center gap-1.5 max-w-full">
                <span className="hidden sm:inline">Department: </span>
                <span className="sm:hidden">Dept: </span>
                <span className="truncate max-w-[120px] sm:max-w-none">{filters.department}</span>
                <button 
                  onClick={() => setFilters({ ...filters, department: 'all' })}
                  className="ml-0.5 sm:ml-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 transition-colors shrink-0"
                  aria-label="Remove department filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="outline" className="px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs h-7 sm:h-6 flex items-center gap-1.5 max-w-full">
                <span className="hidden sm:inline">Search: </span>
                <span className="sm:hidden">S: </span>
                <span className="truncate max-w-[100px] sm:max-w-none">"{searchTerm.length > 15 ? searchTerm.substring(0, 15) + '...' : searchTerm}"</span>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="ml-0.5 sm:ml-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 transition-colors shrink-0"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}