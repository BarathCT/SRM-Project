import { Users, UserCog, UserCheck, UserPlus, UserMinus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const roleColors = {
  super_admin: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  campus_admin: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  admin: { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-200' },
  faculty: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  default: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
};

export default function UserStatsCard({ 
  users = [], 
  filteredUsers = [], 
  roleOptions = [],
  activeUsers = 0,
  inactiveUsers = 0,
  loading = false
}) {
  // Calculate percentages for visual indicators
  const totalUsers = users.length;
  const filteredCount = filteredUsers.length;
  const filteredPercentage = totalUsers > 0 ? Math.round((filteredCount / totalUsers) * 100) : 0;
  const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

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
                {loading ? 'Fetching latest user information' : 'Overview of all system users'}
              </CardDescription>
            </div>
          </div>
          <Badge variant={filteredCount === totalUsers ? 'outline' : 'default'} className="px-3 py-1">
            {filteredCount === totalUsers ? 'Showing all' : `${filteredCount} filtered`}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Loading data...</span>
                <span>0%</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 h-16 rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter progress indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  Showing {filteredCount} of {totalUsers} users ({filteredPercentage}%)
                </span>
                <span>{filteredPercentage}%</span>
              </div>
              <Progress value={filteredPercentage} className="h-2" />
            </div>

            {/* Main stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total users */}
              <div className="border rounded-lg p-3 bg-white shadow-sm">
                <div className="flex items-center space-x-2 text-gray-500 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium">Total Users</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">{totalUsers}</div>
              </div>

              {/* Active users */}
              <div className="border rounded-lg p-3 bg-white shadow-sm">
                <div className="flex items-center space-x-2 text-green-500 mb-1">
                  <UserCheck className="h-4 w-4" />
                  <span className="text-xs font-medium">Active</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">{activeUsers}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {activePercentage}% of total
                </div>
              </div>

              {/* Inactive users */}
              <div className="border rounded-lg p-3 bg-white shadow-sm">
                <div className="flex items-center space-x-2 text-gray-500 mb-1">
                  <UserMinus className="h-4 w-4" />
                  <span className="text-xs font-medium">Inactive</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">{inactiveUsers}</div>
              </div>

              {/* Recent additions (example) */}
              <div className="border rounded-lg p-3 bg-white shadow-sm">
                <div className="flex items-center space-x-2 text-blue-500 mb-1">
                  <UserPlus className="h-4 w-4" />
                  <span className="text-xs font-medium">New (7d)</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {users.filter(u => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(u.createdAt) > weekAgo;
                  }).length}
                </div>
              </div>
            </div>

            {/* Role distribution */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <UserCog className="h-4 w-4 mr-2 text-gray-500" />
                Role Distribution
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {roleOptions.map(role => {
                  const roleUsers = users.filter(u => u.role === role.value);
                  const count = roleUsers.length;
                  const percentage = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
                  const color = getRoleColor(role.value);

                  return count > 0 ? (
                    <div 
                      key={role.value} 
                      className={`border rounded-lg p-3 ${color.bg} ${color.border} shadow-sm`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className={`text-xs font-medium ${color.text}`}>
                            {role.label}s
                          </div>
                          <div className="text-xl font-bold text-gray-800 mt-1">
                            {count}
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-xs ${color.text} ${color.border}`}>
                          {percentage}%
                        </Badge>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-1.5 mt-2" 
                        indicatorColor={color.text.replace('text-', 'bg-')}
                      />
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}