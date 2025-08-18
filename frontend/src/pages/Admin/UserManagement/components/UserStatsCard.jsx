import { useState, useMemo, useCallback } from 'react';
import { 
  Users, 
  Building2,
  Layers,
  BarChart3,
  Award,
  Eye,
  Target,
  PieChart as PieChartIcon,
  Network
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import FilterControls from './UserStats/FilterControls';
import UserStatisticsCard from './UserStats/UserStatisticsCard';
import SuperAdminNotice from './UserStats/SuperAdminNotice';
import AnalyticsChart from './UserStats/charts/AnalyticsChart';
import CollegeSummaryGrid from './UserStats/charts/CollegeSummaryGrid';
import CollegeHierarchyTree from './UserStats/tree/CollegeHierarchicalTree';
import SummaryCard from './UserStats/SummaryCard';
import StatSkeleton from './UserStats/StatSkeleton';

import {
  collegeOptions as COLLEGE_OPTIONS,
  collegesWithoutInstitutes,
  getDepartments,
  getInstitutesForCollege,
  getAllInstituteNames,
  getAllDepartmentNames,
  ALL_COLLEGE_NAMES
} from '@/utils/collegeData';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

const roleConfig = {
  super_admin: {
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    icon: Users,
    label: 'Super Admin',
    color: '#8b5cf6',
  },
  campus_admin: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: Building2,
    label: 'Campus Admin',
    color: '#3b82f6',
  },
  faculty: {
    bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: Layers,
    label: 'Faculty',
    color: '#10b981',
  },
};

const chartColors = {
  campus_admin: '#3b82f6',
  faculty: '#10b981',
};
const extendedColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
  '#14b8a6', '#f59e0b', '#ef4444', '#06b6d4',
  '#84cc16', '#f97316', '#ec4899', '#6366f1', '#14b8a6'
];

const NON_INSTITUTE_COLLEGES = collegesWithoutInstitutes;

export default function UserStatsCard({
  users = [],
  roleOptions = [],
  loading = false,
  className = "",
  currentUser
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    college: 'all',
    institute: 'all',
    department: 'all'
  });
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const currentUserRole = currentUser?.role || 'super_admin';
  const isCampusAdmin = currentUserRole === 'campus_admin';

  // For campus admin: only show department analytics for their scope.
  let campusAdminDepartments = [];
  if (isCampusAdmin) {
    if (
      currentUser.college &&
      currentUser.institute &&
      getDepartments(currentUser.college, currentUser.institute).length > 0
    ) {
      campusAdminDepartments = getDepartments(currentUser.college, currentUser.institute);
    } else if (currentUser.college) {
      campusAdminDepartments = getDepartments(currentUser.college);
    }
  }

  // TABS
  const chartTabs = isCampusAdmin
    ? [
        { value: 'overview', label: 'Overview', icon: Eye },
        { value: 'departments', label: 'Departments', icon: Award }
      ]
    : [
        { value: 'overview', label: 'Overview', icon: Eye },
        { value: 'colleges', label: 'Colleges', icon: Building2 },
        { value: 'institutes', label: 'Institutes', icon: Layers },
        { value: 'departments', label: 'Departments', icon: Award }
      ];

  const selectedCollegeHasInstitutes = useMemo(() => {
    if (filters.college === 'all') return true;
    return !NON_INSTITUTE_COLLEGES.includes(filters.college);
  }, [filters.college]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesRole = filters.role === 'all' || user.role === filters.role;
      const matchesCollege = filters.college === 'all' || user.college === filters.college;
      const matchesInstitute = filters.institute === 'all' || user.institute === filters.institute;
      const matchesDepartment = filters.department === 'all' || user.department === filters.department;
      return matchesRole && matchesCollege && matchesInstitute && matchesDepartment;
    });
  }, [users, filters]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      if (key === 'college' && NON_INSTITUTE_COLLEGES.includes(value)) {
        newFilters.institute = 'all';
      }
      return newFilters;
    });
    setSelectedSegment(null);
    setSelectedLocation(null);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      role: 'all',
      college: 'all',
      institute: 'all',
      department: 'all'
    });
    setSelectedSegment(null);
    setSelectedLocation(null);
  }, []);

  const handleChartClick = useCallback((item, type) => {
    setSelectedSegment(selectedSegment === item.label ? null : item.label);
    if (type === 'colleges') handleFilterChange('college', item.label);
    else if (type === 'institutes') handleFilterChange('institute', item.label);
  }, [selectedSegment, handleFilterChange]);

  const handleLocationClick = useCallback((location) => {
    setSelectedLocation(selectedLocation === location ? null : location);
  }, [selectedLocation]);

  // Canonical names for axes
  const allDepartments = isCampusAdmin
    ? campusAdminDepartments
    : getAllDepartmentNames();
  const allInstitutes = getAllInstituteNames();
  const allColleges = ALL_COLLEGE_NAMES;

  // Stats calculation with scoping for campus_admin
  const statistics = useMemo(() => {
    const totalUsers = filteredUsers.length;
    const roleStats = {
      super_admin: filteredUsers.filter(u => u.role === 'super_admin').length,
      campus_admin: filteredUsers.filter(u => u.role === 'campus_admin').length,
      faculty: filteredUsers.filter(u => u.role === 'faculty').length,
      total: totalUsers
    };

    // Department
    const departmentStats = {};
    allDepartments.forEach(dept => { departmentStats[dept] = 0; });
    filteredUsers
      .filter(user => user.role !== 'super_admin')
      .forEach(user => {
        if (user.department && departmentStats.hasOwnProperty(user.department)) {
          departmentStats[user.department]++;
        }
      });
    const departmentDistribution = allDepartments.map(dept => ({
      label: dept,
      value: departmentStats[dept] || 0
    }));

    const rolesByDepartment = {};
    allDepartments.forEach(dept => {
      rolesByDepartment[dept] = { campus_admin: 0, faculty: 0 };
    });
    filteredUsers
      .filter(user => user.role !== 'super_admin')
      .forEach(user => {
        if (user.department && rolesByDepartment.hasOwnProperty(user.department) && user.role) {
          rolesByDepartment[user.department][user.role] = (rolesByDepartment[user.department][user.role] || 0) + 1;
        }
      });

    // College/Institute only for non-campus-admin
    let collegeDistribution = [];
    let rolesByCollege = {};
    let instituteDistribution = [];
    let rolesByInstitute = {};
    if (!isCampusAdmin) {
      // Colleges
      const collegeStats = {};
      allColleges.forEach(c => { collegeStats[c] = 0; });
      filteredUsers
        .filter(user => user.role !== 'super_admin')
        .forEach(user => {
          if (user.college && collegeStats.hasOwnProperty(user.college)) {
            collegeStats[user.college]++;
          }
        });
      collegeDistribution = allColleges.map(college => ({
        label: college,
        value: collegeStats[college] || 0
      }));

      rolesByCollege = {};
      allColleges.forEach(college => {
        rolesByCollege[college] = { campus_admin: 0, faculty: 0 };
      });
      filteredUsers
        .filter(user => user.role !== 'super_admin')
        .forEach(user => {
          if (user.college && rolesByCollege.hasOwnProperty(user.college) && user.role) {
            rolesByCollege[user.college][user.role] = (rolesByCollege[user.college][user.role] || 0) + 1;
          }
        });

      // Institutes
      const instituteStats = {};
      allInstitutes.forEach(i => { instituteStats[i] = 0; });
      filteredUsers
        .filter(user => user.role !== 'super_admin')
        .forEach(user => {
          if (user.institute && instituteStats.hasOwnProperty(user.institute)) {
            instituteStats[user.institute]++;
          }
        });
      instituteDistribution = allInstitutes.map(inst => ({
        label: inst,
        value: instituteStats[inst] || 0
      }));

      rolesByInstitute = {};
      allInstitutes.forEach(inst => {
        rolesByInstitute[inst] = { campus_admin: 0, faculty: 0 };
      });
      filteredUsers
        .filter(user => user.role !== 'super_admin')
        .forEach(user => {
          if (user.institute && rolesByInstitute.hasOwnProperty(user.institute) && user.role) {
            rolesByInstitute[user.institute][user.role] = (rolesByInstitute[user.institute][user.role] || 0) + 1;
          }
        });
    }

    return {
      totalUsers,
      roleStats,
      collegeDistribution,
      instituteDistribution,
      departmentDistribution,
      rolesByCollege,
      rolesByInstitute,
      rolesByDepartment,
    };
  }, [filteredUsers, isCampusAdmin, allDepartments, allColleges, allInstitutes]);

  // Chart configs
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements, chart) => {
      if (elements.length > 0) {
        const elementIndex = elements[0].index;
        const label = chart.data.labels[elementIndex];
        const value = chart.data.datasets[0].data[elementIndex];
        handleChartClick({ label, value }, 'colleges');
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11
          },
          generateLabels: function (chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return {
                  text: `${label}: ${value} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].backgroundColor[i],
                  pointStyle: 'circle'
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white'
      }
    }
  };

  // Chart Data Creators
  const createRolesByDepartmentChart = (data) => {
    const departments = allDepartments;
    const roles = ['campus_admin', 'faculty'];
    return {
      labels: departments,
      datasets: roles.map(role => ({
        label: roleConfig[role]?.label || role,
        data: departments.map(department => data[department][role] || 0),
        backgroundColor: chartColors[role],
        borderColor: chartColors[role],
        borderWidth: 1
      }))
    };
  };

  const createRolesByLocationChart = (data, allLocations) => {
    const locations = allLocations;
    const roles = ['campus_admin', 'faculty'];
    return {
      labels: locations,
      datasets: roles.map(role => ({
        label: roleConfig[role]?.label || role,
        data: locations.map(location => data[location]?.[role] || 0),
        backgroundColor: chartColors[role],
        borderColor: chartColors[role],
        borderWidth: 1
      }))
    };
  };

  const createPieData = (distribution) => ({
    labels: distribution.map(item => item.label),
    datasets: [{
      data: distribution.map(item => item.value),
      backgroundColor: extendedColors.slice(0, distribution.length),
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  });

  if (loading) {
    return (
      <div className={`animate-in fade-in-0 zoom-in-95 duration-500 ${className}`}>
        <Card className="border border-gray-200 bg-white shadow-sm overflow-hidden">
          <StatSkeleton />
        </Card>
      </div>
    );
  }

  const collegeSummaries = statistics.rolesByCollege
    ? allColleges.map(college => (
        <SummaryCard
          key={college}
          location={college}
          roles={statistics.rolesByCollege[college] || { campus_admin: 0, faculty: 0 }}
          onClick={handleLocationClick}
          isSelected={selectedLocation === college}
        />
      ))
    : [];

  return (
    <div className={`animate-in fade-in-0 zoom-in-95 duration-500 ${className}`}>
      <Card className="border border-gray-200 bg-white shadow-xs overflow-hidden">
        {/* Header */}
        <CardHeader className="pb-4 pt-5 bg-gradient-to-r from-white to-blue-50/80 border-b border-blue-100">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Advanced User Analytics Dashboard
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 mt-1">
                    Real-time hierarchical analysis with interactive filtering
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 text-base font-semibold shadow-sm">
                  {statistics.totalUsers} Total Users
                </Badge>
              </div>
            </div>
            <FilterControls
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
              stats={{ filtered: statistics.totalUsers, total: users.length }}
              showInstituteFilter={!isCampusAdmin && selectedCollegeHasInstitutes}
              currentUser={currentUser}
            />
            <UserStatisticsCard 
              roleStats={statistics.roleStats} 
              currentRole={currentUserRole}
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full grid-cols-${chartTabs.length} mb-6 bg-gray-50 p-1 rounded-xl`}>
              {chartTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center space-x-2 rounded-lg">
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isCampusAdmin ? (
                  <>
                    <AnalyticsChart
                      type="pie"
                      data={createPieData(statistics.departmentDistribution)}
                      options={pieOptions}
                      title="Department Distribution"
                      icon={Award}
                      iconColor="text-gray-600"
                      badgeText="Your Departments"
                    />
                    <AnalyticsChart
                      type="bar"
                      data={createRolesByDepartmentChart(statistics.rolesByDepartment)}
                      options={{
                        ...chartOptions,
                        indexAxis: 'y',
                      }}
                      title="Role Distribution by Department"
                      icon={BarChart3}
                      iconColor="text-blue-600"
                      badgeText="Your Departments"
                      badgeColor="bg-purple-50 text-purple-700 border-purple-200"
                    />
                  </>
                ) : (
                  <>
                    <AnalyticsChart
                      type="pie"
                      data={createPieData(statistics.collegeDistribution)}
                      options={pieOptions}
                      title="College Distribution"
                      icon={BarChart3}
                      iconColor="text-blue-600"
                      badgeText=""
                    />
                    <AnalyticsChart
                      type="pie"
                      data={createPieData(statistics.departmentDistribution)}
                      options={pieOptions}
                      title="Department Distribution"
                      icon={Award}
                      iconColor="text-gray-600"
                      badgeText=""
                    />
                  </>
                )}
              </div>
            </TabsContent>
            {!isCampusAdmin && (
              <TabsContent value="colleges" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <AnalyticsChart
                    type="bar"
                    data={createRolesByLocationChart(statistics.rolesByCollege, allColleges)}
                    options={chartOptions}
                    title="Interactive Role Distribution by College"
                    icon={Target}
                    iconColor="text-blue-600"
                    badgeText=""
                  />
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h5 className="font-semibold text-gray-800 mb-4">Interactive College Summary</h5>
                    <CollegeSummaryGrid summaries={collegeSummaries} />
                  </div>
                </div>
              </TabsContent>
            )}
            {!isCampusAdmin && (
              <TabsContent value="institutes" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnalyticsChart
                      type="bar"
                      data={createRolesByLocationChart(statistics.rolesByInstitute, allInstitutes)}
                      options={chartOptions}
                      title="Institute Distribution"
                      icon={BarChart3}
                      iconColor="text-green-600"
                      badgeText=""
                      badgeColor="bg-green-50 text-green-700 border-green-200"
                    />
                    <AnalyticsChart
                      type="doughnut"
                      data={createPieData(statistics.instituteDistribution)}
                      options={pieOptions}
                      title="Institute Performance"
                      icon={Network}
                      iconColor="text-purple-600"
                      badgeText=""
                      badgeColor="bg-purple-50 text-purple-700 border-purple-200"
                    />
                  </div>
                  {/* CollegeHierarchyTree could go here */}
                </div>
              </TabsContent>
            )}
            <TabsContent value="departments" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <AnalyticsChart
                  type="bar"
                  data={createRolesByDepartmentChart(statistics.rolesByDepartment)}
                  options={{
                    ...chartOptions,
                    indexAxis: 'y',
                  }}
                  title="Department Distribution"
                  icon={BarChart3}
                  iconColor="text-purple-600"
                  badgeText="Department-wise User Count"
                  badgeColor="bg-purple-50 text-purple-700 border-purple-200"
                />
                <AnalyticsChart
                  type="doughnut"
                  data={createPieData(statistics.departmentDistribution)}
                  options={pieOptions}
                  title="Department Analytics"
                  icon={PieChartIcon}
                  iconColor="text-orange-600"
                  badgeText="Department-wise User Analytics"
                  badgeColor="bg-purple-50 text-purple-700 border-purple-200"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}