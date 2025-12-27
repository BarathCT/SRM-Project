import { User, Edit, Trash2, Users, Plus, X, Mail, BadgeCheck, Shield, Building2, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useState } from 'react';

export default function UserTable({
  users,
  filteredUsers,
  isLoading,
  currentUser,
  getRoleColor,
  canModifyUser,
  handleEdit,
  setDeleteDialogOpen,
  setUserToDelete,
  getAvailableRoles,
  filters,
  searchTerm,
  resetFilters,
  setOpenDialog
}) {
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[names.length - 1][0]}` 
      : names[0][0];
  };

  const renderInstituteColumn = (user) => {
    const userRole = currentUser?.role || 'super_admin';
    if (userRole === 'super_admin') {
      return (
        <div className="flex flex-col">
          <div className="flex items-center text-sm">
            <Layers className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            <span className="truncate max-w-[120px]">
              {user.institute === 'N/A' ? '-' : user.institute}
            </span>
          </div>
          {user.department && (
            <div className="text-xs text-gray-500 ml-5 truncate max-w-[110px]">
              {user.department}
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="flex items-center text-sm">
        <Layers className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
        <span className="truncate max-w-[120px]">
          {user.department || '-'}
        </span>
      </div>
    );
  };

  const currentUserRole = currentUser?.role || 'super_admin';

  // --- Pagination state ---
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <Table className="min-w-full">
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[220px]">User</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="w-[150px]">Role</TableHead>
            <TableHead className="w-[150px]">College</TableHead>
            <TableHead className="w-[150px]">
              {currentUserRole === 'super_admin' ? 'Institute & Department' : 'Department'}
            </TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </TableCell>
              </TableRow>
            ))
          ) : paginatedUsers.length > 0 ? (
            paginatedUsers.map((user) => (
              <TableRow key={user._id} className="hover:bg-gray-50/50">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.fullName} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-xs text-gray-500">
                        Joined {format(new Date(user.createdAt), 'MMM yyyy')}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center text-sm">
                      <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      <span className="truncate max-w-[180px]">{user.email}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <BadgeCheck className="h-3.5 w-3.5 mr-1.5" />
                      {user.facultyId || 'No ID'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getRoleColor(user.role)} flex items-center gap-1.5 capitalize`}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    {user.role.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Building2 className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    <span className="truncate max-w-[120px]">
                      {user.college || '-'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {renderInstituteColumn(user)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {canModifyUser && canModifyUser(user) && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(user)}
                              className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit user</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setUserToDelete(user._id);
                                setDeleteDialogOpen(true);
                              }}
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete user</TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-96 text-center">
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <Users className="h-12 w-12 text-gray-400" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {users.length === 0 ? 'No users found' : 'No matching users'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {users.length === 0 
                        ? 'Get started by adding your first user' 
                        : 'Try adjusting your search or filter criteria'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getAvailableRoles && getAvailableRoles().length > 0 && users.length === 0 && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => setOpenDialog(true)}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add User
                      </Button>
                    )}
                    {(filters.role !== 'all' || filters.institute !== 'all' || searchTerm) && users.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={resetFilters}
                        className="mt-2"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4 border-t bg-white">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {renderPageNumbers().map((page, idx) =>
            page === '...' ? (
              <span key={idx} className="px-2 text-gray-500">...</span>
            ) : (
              <Button
                key={idx}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                className={`h-8 w-8 ${currentPage === page ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            )
          )}
          <span className="ml-4 text-sm text-gray-500">
  {filteredUsers.length} total
</span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
