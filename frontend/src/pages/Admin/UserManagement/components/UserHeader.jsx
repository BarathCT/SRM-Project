import { UserCog, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserHeader({ currentUser, getAvailableRoles, setOpenDialog }) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <div className="flex items-center space-x-3 mb-1">
          <UserCog className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">User Management</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {currentUser?.role === 'super_admin'
            ? 'Manage all users across all campuses'
            : `Managing users for ${currentUser?.college || 'your campus'}`}
        </p>
      </div>
      {getAvailableRoles().length > 0 && (
        <Button className="bg-blue-500 hover:bg-blue-600" onClick={() => setOpenDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      )}
    </div>
  );
}