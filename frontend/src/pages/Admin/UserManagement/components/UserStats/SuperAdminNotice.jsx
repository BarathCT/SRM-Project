import { Shield, Info } from 'lucide-react';

const SuperAdminNotice = ({ superAdminCount }) => (
  <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-8 text-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="p-4 bg-purple-200/50 rounded-full">
        <Shield className="w-8 h-8 text-purple-600" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-purple-800">
          Super Admin View
        </h3>
        <p className="text-purple-700 max-w-md">
          Super Administrators are not associated with specific colleges, institutes, or departments. 
          They have system-wide access and privileges.
        </p>
      </div>
      <div className="flex items-center space-x-2 mt-4">
        <Info className="w-5 h-5 text-purple-600" />
        <span className="text-sm text-purple-700">
          Currently showing <strong>{superAdminCount}</strong> Super Admin{superAdminCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  </div>
);

export default SuperAdminNotice;