import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, RefreshCw } from 'lucide-react';
import {
  collegeOptions as COLLEGE_OPTIONS,
  getInstitutesForCollege,
  getDepartments,
  collegesWithoutInstitutes,
  getAllDepartmentNames,
  getAllInstituteNames
} from '@/utils/collegeData';

export default function FilterControls({
  filters,
  onFilterChange,
  onReset,
  stats,
  showInstituteFilter = true,
  currentUser // <-- Pass currentUser from parent
}) {
  const isCampusAdmin = currentUser?.role === 'campus_admin';

  // Determine available departments for campus admin
  let departmentOptions = [];
  if (isCampusAdmin) {
    if (collegesWithoutInstitutes.includes(currentUser.college)) {
      departmentOptions = getDepartments(currentUser.college);
    } else if (currentUser.institute) {
      departmentOptions = getDepartments(currentUser.college, currentUser.institute);
    }
  }

  // For super admin etc
  const allColleges = COLLEGE_OPTIONS.map(c => c.name);
  const allInstitutes = getAllInstituteNames();
  const allDepartments = getAllDepartmentNames();

  // Role options for dropdown
  const roleOptions = isCampusAdmin
    ? [
        { value: "all", label: "All Roles" },
        { value: "campus_admin", label: "Campus Admin" },
        { value: "faculty", label: "Faculty" }
      ]
    : [
        { value: "all", label: "All Roles" },
        { value: "super_admin", label: "Super Admin" },
        { value: "campus_admin", label: "Campus Admin" },
        { value: "faculty", label: "Faculty" }
      ];

  // Explicit grid columns for one-row layout
  let gridColsClass = '';
  if (isCampusAdmin) {
    gridColsClass = 'sm:grid-cols-2'; // only role and department
  } else {
    gridColsClass = showInstituteFilter ? 'sm:grid-cols-4' : 'sm:grid-cols-3';
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-sm mb-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-800">Advanced Filters</span>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {stats.filtered} / {stats.total} users
            </Badge>
          </div>
          <Button
            variant="outline"
            onClick={onReset}
            size="sm"
            className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset All
          </Button>
        </div>
        {/* One-row filter bar on desktop */}
        <div className={`grid grid-cols-1 ${gridColsClass} gap-4`}>
          {/* Role Filter */}
          <div className="w-full">
            <Select value={filters.role} onValueChange={v => onFilterChange('role', v)}>
              <SelectTrigger className="w-full bg-white/90 border-gray-200">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* College Filter (not for campus admin) */}
          {!isCampusAdmin && (
            <div className="w-full">
              <Select value={filters.college} onValueChange={v => onFilterChange('college', v)}>
                <SelectTrigger className="w-full bg-white/90 border-gray-200">
                  <SelectValue placeholder="All Colleges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {allColleges.map(college => (
                    <SelectItem key={college} value={college}>{college}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Institute Filter (not for campus admin) */}
          {showInstituteFilter && !isCampusAdmin && (
            <div className="w-full">
              <Select value={filters.institute} onValueChange={v => onFilterChange('institute', v)}>
                <SelectTrigger className="w-full bg-white/90 border-gray-200">
                  <SelectValue placeholder="All Institutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutes</SelectItem>
                  {allInstitutes.map(inst => (
                    <SelectItem key={inst} value={inst}>{inst}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Department Filter */}
          <div className="w-full">
            <Select value={filters.department} onValueChange={v => onFilterChange('department', v)}>
              <SelectTrigger className="w-full bg-white/90 border-gray-200">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {(isCampusAdmin
                  ? departmentOptions
                  : allDepartments
                ).map(dep => (
                  <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}