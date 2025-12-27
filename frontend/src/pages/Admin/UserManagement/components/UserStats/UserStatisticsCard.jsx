import { Badge } from '@/components/ui/badge';
import { UserCheck, Shield, Building, GraduationCap } from 'lucide-react';

const roleConfig = {
  super_admin: { 
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100', 
    text: 'text-purple-800', 
    border: 'border-purple-200',
    icon: Shield,
    label: 'Super Admin',
    color: '#8b5cf6'
  },
  campus_admin: { 
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100', 
    text: 'text-blue-800', 
    border: 'border-blue-200',
    icon: Building,
    label: 'Campus Admin',
    color: '#3b82f6'
  },
  faculty: { 
    bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', 
    text: 'text-emerald-800', 
    border: 'border-emerald-200',
    icon: GraduationCap,
    label: 'Faculty',
    color: '#10b981'
  }
};

const UserStatisticsCard = ({ roleStats, currentRole }) => {
  // Hide super_admin card for campus_admin users, regardless of filter and stats
  // Always hide the "total" property as well
  const filteredRoles = Object.entries(roleStats).filter(([role]) => {
    // Hide "super_admin" for campus admin, always hide "total"
    if (currentRole === 'campus_admin') {
      return role !== 'super_admin' && role !== 'total';
    }
    // For super_admin or anyone else, show all (except total)
    return role !== 'total';
  });

  // Determine grid columns
  let gridColsClass = '';
  if (currentRole === 'super_admin') {
    gridColsClass = 'sm:grid-cols-3';
  } else if (currentRole === 'campus_admin') {
    gridColsClass = 'sm:grid-cols-2';
  } else {
    gridColsClass = `sm:grid-cols-${filteredRoles.length}`;
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
      <div className="mb-6">
        <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
          <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
          User Statistics Overview
        </h5>
        <p className="text-sm text-gray-600">
          Comprehensive breakdown of all user roles across the platform
        </p>
      </div>
      <div className={`grid grid-cols-1 ${gridColsClass} gap-6`}>
        {filteredRoles.map(([role, count]) => {
          const config = roleConfig[role];
          if (!config) return null;
          return (
            <div 
              key={role} 
              className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:border-gray-300 bg-white/90 ${config.border} overflow-hidden`}
            >
              <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                <div className={`p-3 rounded-full ${config.bg} ${config.border} border-2`}>
                  <config.icon className={`w-6 h-6 ${config.text}`} />
                </div>
                <div className="space-y-1">
                  <h6 className="text-sm font-medium text-gray-700">{config.label}</h6>
                  <div className="text-3xl font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-600">
                    {roleStats.total > 0 ? ((count / roleStats.total) * 100).toFixed(1) : 0}% of total
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-3 w-17 h-17 opacity-10">
                <config.icon className="w-full h-full" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Active Users:</span>
          <span className="font-semibold text-gray-900">{roleStats.total}</span>
        </div>
      </div>
    </div>
  );
};

export default UserStatisticsCard;