import { Users, UserCog } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const roleColors = {
  super_admin: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  campus_admin: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  admin: { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-200' },
  faculty: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  default: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
};

export default function UserStatsCard({ 
  users = [], 
  roleOptions = [],
  loading = false
}) {
  const totalUsers = users.length;

  // Get color for role badges
  const getRoleColor = (role) => {
    return roleColors[role] || roleColors.default;
  };

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50/50 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${loading ? 'bg-gray-100' : 'bg-blue-100'}`}>
              <Users className={`h-5 w-5 ${loading ? 'text-gray-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-800">
                {loading ? 'Loading user data...' : 'User Statistics'}
              </CardTitle>
              <CardDescription className="text-sm">
                {loading ? 'Fetching latest user information' : 'Overview of system users by role'}
              </CardDescription>
            </div>
          </div>
          <Badge variant="default" className="px-3 py-1">
            Total: {totalUsers}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 h-16 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Role distribution */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <UserCog className="h-4 w-4 mr-2 text-gray-500" />
                Role Distribution
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {roleOptions.map(role => {
                  const count = users.filter(u => u.role === role.value).length;
                  const color = getRoleColor(role.value);

                  return (
                    <div 
                      key={role.value} 
                      className={`border rounded-lg p-3 ${color.bg} ${color.border} shadow-sm`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className={`text-xs font-medium ${color.text}`}>
                            {role.label}
                          </div>
                          <div className="text-xl font-bold text-gray-800 mt-1">
                            {count}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}