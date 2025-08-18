import { Badge } from '@/components/ui/badge';

const roleConfig = {
  super_admin: {
    text: 'text-purple-800',
    icon: () => null, // Not shown in the SummaryCard
    label: 'Super Admin'
  },
  campus_admin: {
    text: 'text-blue-800',
    icon: () => null, // Not shown in the SummaryCard
    label: 'Campus Admin'
  },
  faculty: {
    text: 'text-emerald-800',
    icon: () => null, // Not shown in the SummaryCard
    label: 'Faculty'
  }
};

export default function SummaryCard({ location, roles, onClick, isSelected }) {
  const roleEntries = Object.entries(roles).filter(
    ([role, count]) => count > 0 && role !== 'super_admin'
  );
  const totalUsers = Object.entries(roles)
    .filter(([role]) => role !== 'super_admin')
    .reduce((sum, [, count]) => sum + count, 0);

  return (
    <div
      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'bg-blue-50 border-2 border-blue-300 shadow-sm'
          : 'bg-white/90 border border-gray-200'
      }`}
      onClick={() => onClick && onClick(location)}
    >
      <div className="flex items-center justify-between mb-3">
        <h6 className="font-medium text-gray-800 truncate" title={location}>
          {location}
        </h6>
        <Badge
          variant={isSelected ? 'default' : 'outline'}
          className={`text-xs ${
            isSelected
              ? 'bg-blue-600 text-white'
              : 'bg-gray-50 text-gray-700 border-gray-200'
          }`}
        >
          {totalUsers}
        </Badge>
      </div>
      <div className="space-y-2">
        {roleEntries.map(([role, count]) => {
          const config = roleConfig[role];
          if (!config) return null;
          return (
            <div key={role} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* (Optional) Add icon here if desired: <config.icon className={`w-3 h-3 ${config.text}`} /> */}
                <span className={`text-sm ${config.text}`}>{config.label}</span>
              </div>
              <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200">
                {count}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}