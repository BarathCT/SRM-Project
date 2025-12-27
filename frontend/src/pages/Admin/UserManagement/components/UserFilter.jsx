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
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium">Filters</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="px-2 py-0.5">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-gray-500 hover:text-gray-700 h-8 px-3"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search" className="flex items-center text-sm">
            <Search className="h-4 w-4 mr-2 text-gray-500" />
            Search
          </Label>
          <Input
            id="search"
            placeholder="Name, email, or faculty ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* College filter (only for super admin) */}
        {shouldShowCollegeFilter && (
          <div className="space-y-2">
            <Label htmlFor="filter-college" className="flex items-center text-sm">
              <Building className="h-4 w-4 mr-2 text-gray-500" />
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
              <SelectTrigger>
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
        <div className="space-y-2">
          <Label htmlFor="filter-role" className="flex items-center text-sm">
            <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
            Role
          </Label>
          <Select
            value={filters.role}
            onValueChange={(value) => setFilters({ ...filters, role: value })}
          >
            <SelectTrigger>
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

        {/* Institute filter: only show when college is selected and has institutes */}
        {shouldShowInstituteFilter && filters.college !== 'all' && !collegesWithoutInstitutes.includes(filters.college) && (
          <div className="space-y-2">
            <Label htmlFor="filter-institute" className="flex items-center text-sm">
              <Layers className="h-4 w-4 mr-2 text-gray-500" />
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
              <SelectTrigger>
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
              <div className="space-y-2">
                <Label htmlFor="filter-department" className="flex items-center text-sm">
                  <Layers className="h-4 w-4 mr-2 text-gray-500" />
                  Department
                </Label>
                <Select
                  value={filters.department}
                  onValueChange={(value) => setFilters({ ...filters, department: value })}
                >
                  <SelectTrigger>
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
              <div className="space-y-2">
                <Label htmlFor="filter-department" className="flex items-center text-sm">
                  <Layers className="h-4 w-4 mr-2 text-gray-500" />
                  Department
                </Label>
                <Select
                  value={filters.department}
                  onValueChange={(value) => setFilters({ ...filters, department: value })}
                >
                  <SelectTrigger>
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
            <div className="space-y-2">
              <Label htmlFor="filter-department" className="flex items-center text-sm">
                <Layers className="h-4 w-4 mr-2 text-gray-500" />
                Department
              </Label>
              <Select
                value={filters.department}
                onValueChange={(value) => setFilters({ ...filters, department: value })}
              >
                <SelectTrigger>
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

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.role !== 'all' && (
            <Badge variant="outline" className="px-3 py-1">
              Role: {filters.role.charAt(0).toUpperCase() + filters.role.slice(1).replace('_', ' ')}
              <button 
                onClick={() => setFilters({ ...filters, role: 'all' })}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.college !== 'all' && !isCampusAdmin && (
            <Badge variant="outline" className="px-3 py-1">
              College: {filters.college}
              <button 
                onClick={() => setFilters({ ...filters, college: 'all' })}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.institute !== 'all' && !isCampusAdmin && (
            <Badge variant="outline" className="px-3 py-1">
              Institute: {filters.institute}
              <button 
                onClick={() => setFilters({ ...filters, institute: 'all' })}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.department !== 'all' && (
            <Badge variant="outline" className="px-3 py-1">
              Department: {filters.department}
              <button 
                onClick={() => setFilters({ ...filters, department: 'all' })}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {searchTerm && (
            <Badge variant="outline" className="px-3 py-1">
              Search: "{searchTerm}"
              <button 
                onClick={() => setSearchTerm('')}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}