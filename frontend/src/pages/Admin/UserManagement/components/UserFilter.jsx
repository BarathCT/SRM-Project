import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserFilters({
  filters,
  setFilters,
  searchTerm,
  setSearchTerm,
  availableRoles,
  availableCategories,
  availableColleges,
  currentUser,
  resetFilters,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        {(filters.role !== 'all' || filters.category !== 'all' || filters.college !== 'all' || searchTerm) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-4">
        {/* Search Input */}
        <div className="space-y-2 w-full sm:w-auto">
          <Label htmlFor="search" className="text-xs">Search</Label>
          <Input
            id="search"
            placeholder="Search by name or faculty ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>

        {/* College filter (only for super admin) */}
        {currentUser?.role === 'super_admin' && (
          <div className="space-y-2 w-full sm:w-auto">
            <Label htmlFor="filter-college" className="text-xs">College</Label>
            <Select
              value={filters.college}
              onValueChange={(value) => setFilters({ ...filters, college: value })}
            >
              <SelectTrigger className="w-[180px]">
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

        {/* Role filter (for all users) */}
        <div className="space-y-2 w-full sm:w-auto">
          <Label htmlFor="filter-role" className="text-xs">Role</Label>
          <Select
            value={filters.role}
            onValueChange={(value) => setFilters({ ...filters, role: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {availableRoles
                .filter(role => role)
                .map(role => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category filter */}
        {availableCategories.length > 0 && (
          <div className="space-y-2 w-full sm:w-auto">
            <Label htmlFor="filter-category" className="text-xs">Category</Label>
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters({ ...filters, category: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {availableCategories
                  .filter(category => category)
                  .map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}