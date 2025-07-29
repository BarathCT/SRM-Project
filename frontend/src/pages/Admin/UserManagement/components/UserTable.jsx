import { User, Edit, Trash2, Users, Plus, X, Mail, BadgeCheck, Shield, Building2, Layers } from 'lucide-react';
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
  // Function to get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[names.length - 1][0]}` 
      : names[0][0];
  };

  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <Table className="min-w-full">
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[220px]">User</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="w-[150px]">Role</TableHead>
            <TableHead className="w-[150px]">College</TableHead>
            <TableHead className="w-[150px]">Institute</TableHead>
            <TableHead className="w-[150px]">Status</TableHead>
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
                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </TableCell>
              </TableRow>
            ))
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
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
                  <div className="flex items-center text-sm">
                    <Layers className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    <span className="truncate max-w-[120px]">
                      {user.institute === 'N/A' ? '-' : user.institute}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? 'default' : 'destructive'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {canModifyUser(user) && (
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
              <TableCell colSpan={7} className="h-96 text-center">
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
                    {getAvailableRoles().length > 0 && users.length === 0 && (
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
    </div>
  );
}