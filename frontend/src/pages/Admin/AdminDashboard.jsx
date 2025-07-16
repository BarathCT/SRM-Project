import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleManageUsers = () => {
    navigate('/admin/users'); // or any route for user management
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col justify-between">
      {/* Top bar with title and manage button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-blue-800">
          SRM Group Admin Dashboard
        </h1>
        <Button onClick={handleManageUsers} className="bg-blue-600 hover:bg-blue-700 text-white">
          Manage Users
        </Button>
      </div>

      {/* Main dashboard content can go here */}
      <div className="flex-1">
        {/* Placeholder for charts, cards, data grid, etc. */}
        {/* You can insert your pie chart, bar chart, or table here */}
      </div>

      {/* Bottom left aligned overview note */}
      <div className="mt-10 text-sm text-gray-500 text-left">
        Global overview of all colleges and research papers.
      </div>
    </div>
  );
};

export default AdminDashboard;
