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
  // Check if any filters are active
  const hasActiveFilters = 
    filters.role !== 'all' || 
    filters.institute !== 'all' || 
    filters.college !== 'all' || 
    filters.department !== 'all' || 
    searchTerm;

  // Get the count of active filters
  const activeFilterCount = [
    filters.role !== 'all',
    filters.institute !== 'all',
    filters.college !== 'all',
    filters.department !== 'all',
    !!searchTerm,
  ].filter(Boolean).length;

  // Only show institute filter to super_admin or campus_admin
  const showInstituteFilter =
    availableInstitutes.length > 0 &&
    (currentUser?.role === 'super_admin' || currentUser?.role === 'campus_admin');

  // Only show department filter to super_admin, campus_admin, or faculty (no admin)
  const showDepartmentFilter =
    availableDepartments.length > 0 &&
    (currentUser?.role === 'super_admin' ||
      currentUser?.role === 'campus_admin' ||
      currentUser?.role === 'faculty');

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
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
        {currentUser?.role === 'super_admin' && (
          <div className="space-y-2">
            <Label htmlFor="filter-college" className="flex items-center text-sm">
              <Building className="h-4 w-4 mr-2 text-gray-500" />
              College
            </Label>
            <Select
              value={filters.college}
              onValueChange={(value) => setFilters({ ...filters, college: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All colleges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All colleges</SelectItem>
                {availableColleges.map(college => (
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
              <SelectItem value="all">All roles</SelectItem>
              {availableRoles
                .filter(role => role && ['super_admin', 'campus_admin', 'faculty'].includes(role))
                .map(role => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Institute filter */}
        {showInstituteFilter && (
          <div className="space-y-2">
            <Label htmlFor="filter-institute" className="flex items-center text-sm">
              <Layers className="h-4 w-4 mr-2 text-gray-500" />
              Institute
            </Label>
            <Select
              value={filters.institute}
              onValueChange={(value) => setFilters({ ...filters, institute: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All institutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All institutes</SelectItem>
                {availableInstitutes
                  .filter(institute => institute)
                  .map(institute => (
                    <SelectItem key={institute} value={institute}>
                      {institute}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Department filter */}
        {showDepartmentFilter && (
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
                {availableDepartments
                  .filter(department => department)
                  .map(department => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
          {filters.college !== 'all' && (
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
          {filters.institute !== 'all' && (
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