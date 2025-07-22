import { User, Edit, Trash2, Users,X } from 'lucide-react';
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
  return (
    <Table>
      <TableHeader className="bg-gray-50">
        <TableRow>
          <TableHead>Full Name</TableHead>
          <TableHead>Faculty ID</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>College</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="flex justify-end gap-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-8 w-12" />
              </TableCell>
            </TableRow>
          ))
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <TableRow key={user._id} className="hover:bg-gray-50">
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <span className="bg-blue-100 p-1 rounded-full mr-2">
                    <User className="h-4 w-4 text-blue-600" />
                  </span>
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {user.fullName}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {user.facultyId}
              </TableCell>
              <TableCell>
                <span className="truncate max-w-[120px] sm:max-w-none block">
                  {user.email}
                </span>
              </TableCell>
              <TableCell>
                <Badge 
                  className={`${getRoleColor(user.role)} flex items-center gap-1.5 capitalize`}
                >
                  {user.role.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {user.college || '-'}
              </TableCell>
              <TableCell>
                {user.category === 'N/A' ? '-' : user.category}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {canModifyUser(user) && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(user)}
                        className="hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          setUserToDelete(user._id);
                          setDeleteDialogOpen(true);
                        }}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center">
              <div className="flex flex-col items-center justify-center py-6">
                <Users className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  {users.length === 0 ? 'No users found' : 'No users match your filters'}
                </p>
                {getAvailableRoles().length > 0 && users.length === 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setOpenDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add your first user
                  </Button>
                )}
                {(filters.role !== 'all' || filters.category !== 'all' || searchTerm) && users.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2"
                    onClick={resetFilters}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}