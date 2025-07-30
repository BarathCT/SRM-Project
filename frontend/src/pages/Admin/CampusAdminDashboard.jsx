import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

ChartJS.register(ArcElement, Tooltip, Legend);

const CampusAdminDashboard = () => {
  const navigate = useNavigate();

    const handleManageUsers = () => {
    navigate('/campus-admin/users'); // or any route for user management
  };

  const handleViewCategory = (category) => {
    navigate(`/category/${category}`);
  };

  const pieData = {
    labels: ["Engineering and Technology", "Science and Humanities", "Management","Dental"],
    datasets: [
      {
        label: "Papers",
        data: [5, 6, 3, 4],
        backgroundColor: ["#3B82F6", "#FACC15", "#10B981","#red"],
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: "bottom",
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          SRMIST Ramapuram - Admin Dashboard
        </h1>
        <Button onClick={handleManageUsers} className="bg-blue-600 hover:bg-blue-700 text-white">
          Manage Users
        </Button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Papers</p>
            <p className="text-xl font-bold">14</p>
            <p className="text-xs text-gray-400">In SRMIST Ramapuram</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Authors</p>
            <p className="text-xl font-bold">22</p>
            <p className="text-xs text-gray-400">Unique contributing authors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Categories</p>
            <p className="text-xl font-bold">4</p>
            <p className="text-xs text-gray-400">Total in SRMIST Ramapuram</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Category Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <Card className="h-72">
          <CardHeader>
            <CardTitle>Papers by Category</CardTitle>
            <CardDescription>Distribution across main categories.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <Pie data={pieData} options={pieOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View by Category</CardTitle>
            <CardDescription>Select a category to view its papers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onClick={() => handleViewCategory("engineering")}
              className="p-4 border rounded cursor-pointer hover:bg-blue-50"
            >
              <p className="font-medium">Engineering and Technology</p>
              <p className="text-sm text-gray-500">5 papers</p>
            </div>
            <div
              onClick={() => handleViewCategory("science")}
              className="p-4 border rounded cursor-pointer hover:bg-yellow-50"
            >
              <p className="font-medium">Science and Humanities</p>
              <p className="text-sm text-gray-500">6 papers</p>
            </div>
            <div
              onClick={() => handleViewCategory("engineering")}
              className="p-4 border rounded cursor-pointer hover:bg-blue-50"
            >
              <p className="font-medium">Dental</p>
              <p className="text-sm text-gray-500">5 papers</p>
            </div>
            <div
              onClick={() => handleViewCategory("management")}
              className="p-4 border rounded cursor-pointer hover:bg-green-50"
            >
              
              <p className="font-medium">Management</p>
              <p className="text-sm text-gray-500">3 papers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Note */}
      <p className="text-sm text-gray-500">
        A comprehensive view of all research activity from SRMIST Ramapuram.
      </p>
    </div>
  );
};

export default CampusAdminDashboard;
