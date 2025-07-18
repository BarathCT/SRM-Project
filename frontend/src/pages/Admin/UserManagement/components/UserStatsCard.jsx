import { Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function UserStatsCard({ users, filteredUsers, roleOptions }) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 via-white to-blue-50 border-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg text-gray-800">System Users</CardTitle>
        </div>
        <CardDescription className="text-sm">
          Overview of all users with access to ScholarSync
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-800">{filteredUsers.length}</span>
            <span className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </span>
          </div>
          {roleOptions.map(role => (
            users.some(u => u.role === role.value) && (
              <div key={role.value} className="flex items-center space-x-2">
                <span
                  className="text-2xl font-bold"
                  style={{
                    color:
                      role.value === 'super_admin'
                        ? '#7c3aed'
                        : role.value === 'campus_admin'
                        ? '#2563eb'
                        : role.value === 'admin'
                        ? '#1d4ed8'
                        : role.value === 'faculty'
                        ? '#4338ca'
                        : '#3730a3'
                  }}
                >
                  {users.filter(u => u.role === role.value).length}
                </span>
                <span className="text-sm text-muted-foreground">
                  {role.label}s
                </span>
              </div>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
}