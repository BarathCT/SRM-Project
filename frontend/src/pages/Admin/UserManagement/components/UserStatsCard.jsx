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

// --- UNIVERSAL FILTER BUTTON GROUP ---
function FilterButtonGroup({
  filters,
  setFilter,
  selected,
  colorPalette = [],
  showCount,
  countMap,
  type,
  filledColor = "#2563eb", // blue-600
  outlineColor = "#d1d5db", // gray-300
  textColor = "#374151", // gray-700
  filledTextColor = "#fff",
  countBg = "#eff6ff"
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-3 mb-2">
      <button
        type="button"
        onClick={() => setFilter("all")}
        className="text-xs px-3 py-1 rounded-full border transition"
        style={{
          background: selected === "all" ? filledColor : "transparent",
          color: selected === "all" ? filledTextColor : textColor,
          borderColor: selected === "all" ? filledColor : outlineColor,
          fontWeight: selected === "all" ? 600 : 400,
        }}
      >
        All {type}
        {showCount && (
          <span
            className="ml-1 inline-block text-xs font-semibold px-2 rounded-full"
            style={{
              background: selected === "all" ? "rgba(255,255,255,0.2)" : countBg,
              color: selected === "all" ? "#fff" : filledColor
            }}
          >
            {Object.values(countMap || {}).reduce((sum, v) => sum + v, 0)}
          </span>
        )}
      </button>
      {filters.map((v, idx) => {
        const isActive = selected === v;
        const color = colorPalette[idx % colorPalette.length] || filledColor;
        return (
          <button
            key={v}
            type="button"
            onClick={() => setFilter(v)}
            className="text-xs px-3 py-1 rounded-full border transition"
            style={{
              background: isActive ? color : "transparent",
              color: isActive ? "#fff" : color,
              borderColor: color,
              fontWeight: isActive ? 600 : 400,
            }}
          >
            {v}
            {showCount && (
              <span
                className="ml-1 inline-block text-xs font-semibold px-2 rounded-full"
                style={{
                  background: isActive ? "rgba(255,255,255,0.2)" : countBg,
                  color: isActive ? "#fff" : color
                }}
              >
                {(countMap && countMap[v]) || 0}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

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

  // Helper: is the selected college one that has institutes?
  const isNonInstituteCollegeSelected =
    filters.college !== "all" && NON_INSTITUTE_COLLEGES.includes(filters.college);

  // Always show all institutes for selected college, or all institutes if no college selected
  const getActiveInstituteList = () => {
    if (filters.college === "all") return getAllInstituteNames();
    if (isNonInstituteCollegeSelected) return [];
    return getInstitutesForCollege(filters.college) || [];
  };
  const activeInstituteList = getActiveInstituteList();

  // Department legend and data logic (always show all applicable departments for the context)
  const getActiveDepartmentList = () => {
    if (isCampusAdmin) {
      return campusAdminDepartments;
    }
    if (filters.college === "all") return getAllDepartmentNames();
    if (isNonInstituteCollegeSelected) return getDepartments(filters.college);
    // If institute selected, show those departments, else show all departments for that college (across all its institutes)
    if (filters.college !== "all" && filters.institute === "all") {
      const insts = getInstitutesForCollege(filters.college) || [];
      let deptSet = new Set();
      insts.forEach(inst => {
        getDepartments(filters.college, inst)?.forEach(dep => deptSet.add(dep));
      });
      return Array.from(deptSet);
    }
    if (filters.college !== "all" && filters.institute !== "all") {
      return getDepartments(filters.college, filters.institute);
    }
    return [];
  };
  const activeDepartmentList = getActiveDepartmentList();

  // TABS
  const chartTabs = isCampusAdmin
    ? [
        { value: 'overview', label: 'Overview', icon: Eye },
        { value: 'departments', label: 'Departments', icon: Award }
      ]
    : [
        { value: 'overview', label: 'Overview', icon: Eye },
        { value: 'colleges', label: 'Colleges', icon: Building2 },
        ...(isNonInstituteCollegeSelected
          ? []
          : [{ value: 'institutes', label: 'Institutes', icon: Layers }]),
        { value: 'departments', label: 'Departments', icon: Award }
      ];

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

  // Filter drilldown: when a parent changes, reset lower levels
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: prev[key] === value ? "all" : value };
      if (key === 'college') {
        newFilters.institute = "all";
        newFilters.department = "all";
      }
      if (key === 'institute') {
        newFilters.department = "all";
      }
      return newFilters;
    });
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
    setSelectedLocation(null);
  }, []);

  const handleRoleCardClick = useCallback((role) => {
    setFilters(prev => ({ ...prev, role: prev.role === role ? "all" : role }));
  }, []);

  const handleLocationClick = useCallback((location) => {
    setSelectedLocation(selectedLocation === location ? null : location);
  }, [selectedLocation]);

  // Canonical names for axes
  const allDepartments = isCampusAdmin
    ? campusAdminDepartments
    : getAllDepartmentNames();
  const allInstitutes = getAllInstituteNames();
  const allColleges = ALL_COLLEGE_NAMES;

  // Stats calculation
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
    activeDepartmentList.forEach(dept => { departmentStats[dept] = 0; });
    filteredUsers
      .filter(user => user.role !== 'super_admin')
      .forEach(user => {
        if (user.department && departmentStats.hasOwnProperty(user.department)) {
          departmentStats[user.department]++;
        }
      });
    const departmentDistribution = activeDepartmentList.map(dept => ({
      label: dept,
      value: departmentStats[dept] || 0
    }));

    const rolesByDepartment = {};
    activeDepartmentList.forEach(dept => {
      rolesByDepartment[dept] = { campus_admin: 0, faculty: 0 };
    });
    filteredUsers
      .filter(user => user.role !== 'super_admin')
      .forEach(user => {
        if (user.department && rolesByDepartment.hasOwnProperty(user.department) && user.role) {
          rolesByDepartment[user.department][user.role] = (rolesByDepartment[user.department][user.role] || 0) + 1;
        }
      });

    // Colleges/Institutes
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
      activeInstituteList.forEach(i => { instituteStats[i] = 0; });
      filteredUsers
        .filter(user => user.role !== 'super_admin')
        .forEach(user => {
          if (user.institute && instituteStats.hasOwnProperty(user.institute)) {
            instituteStats[user.institute]++;
          }
        });
      instituteDistribution = activeInstituteList.map(inst => ({
        label: inst,
        value: instituteStats[inst] || 0
      }));

      rolesByInstitute = {};
      activeInstituteList.forEach(inst => {
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
  }, [filteredUsers, isCampusAdmin, activeDepartmentList, allColleges, activeInstituteList]);

  // Hierarchical data for CollegeHierarchyTree (for super admin, and not filtering for super_admin)
  const collegeHierarchyData = useMemo(() => {
    if (!users?.length) return {};
    const tree = {};
    users.forEach(user => {
      if (user.role === 'super_admin') return;
      const college = user.college || 'Unknown College';
      const isCollegeWithoutInstitutes = collegesWithoutInstitutes.includes(college);
      
      if (!tree[college]) tree[college] = {};
      
      if (isCollegeWithoutInstitutes) {
        // For colleges without institutes, use college name as the "institute" label
        // This makes it consistent with how institutes are displayed
        const collegeLabel = college;
        if (!tree[college][collegeLabel]) tree[college][collegeLabel] = {};
        tree[college][collegeLabel][user.role] = (tree[college][collegeLabel][user.role] || 0) + 1;
      } else {
        // For colleges with institutes, use institute level but skip N/A
        const institute = user.institute && user.institute !== 'N/A' ? user.institute : null;
        if (institute) {
          if (!tree[college][institute]) tree[college][institute] = {};
          tree[college][institute][user.role] = (tree[college][institute][user.role] || 0) + 1;
        }
      }
    });
    return tree;
  }, [users]);

  // Chart configs
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // hide legend, we use clickable labels below chart
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
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white'
      }
    },
    onClick: () => {}
  };

  // Chart Data Creators
  const createRolesByDepartmentChart = (data) => {
    const departments = activeDepartmentList;
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

  // COUNT MAPS for all chart filter groups
  const collegeCountMap = useMemo(() => {
    const map = {};
    ALL_COLLEGE_NAMES.forEach(college => {
      map[college] = users.filter(u =>
        (filters.role === 'all' || u.role === filters.role) &&
        u.college === college
      ).length;
    });
    return map;
  }, [users, filters.role]);
  const instituteCountMap = useMemo(() => {
    const map = {};
    activeInstituteList.forEach(institute => {
      map[institute] = users.filter(u =>
        (filters.role === 'all' || u.role === filters.role) &&
        (filters.college === 'all' || u.college === filters.college) &&
        u.institute === institute
      ).length;
    });
    return map;
  }, [users, filters.role, filters.college, activeInstituteList]);
  const departmentCountMap = useMemo(() => {
    const map = {};
    activeDepartmentList.forEach(department => {
      map[department] = users.filter(u =>
        (filters.role === 'all' || u.role === filters.role) &&
        (filters.college === 'all' || u.college === filters.college) &&
        (filters.institute === 'all' || u.institute === filters.institute) &&
        u.department === department
      ).length;
    });
    return map;
  }, [users, filters.role, filters.college, filters.institute, activeDepartmentList]);

  if (loading) {
    return (
      <div className={`animate-in fade-in-0 zoom-in-95 duration-500 ${className}`}>
        <Card className="border border-gray-200 bg-white shadow-sm overflow-hidden">
          <StatSkeleton />
        </Card>
      </div>
    );
  }

  // Super Admin Notice: show only if role filter is super_admin and user is super_admin
  if (
    currentUserRole === 'super_admin' &&
    filters.role === 'super_admin'
  ) {
    return (
      <div className={`animate-in fade-in-0 zoom-in-95 duration-500 ${className}`}>
        <SuperAdminNotice superAdminCount={statistics.roleStats.super_admin} />
      </div>
    );
  }

  // College Hierarchical Tree: show only for super admin and not filtering for super_admin
  const showCollegeHierarchicalTree =
    currentUserRole === 'super_admin' && filters.role !== 'super_admin';

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
              showInstituteFilter={!isCampusAdmin && !isNonInstituteCollegeSelected}
              currentUser={currentUser}
            />
            <UserStatisticsCard
              roleStats={statistics.roleStats}
              currentRole={currentUserRole}
              setFilters={handleRoleCardClick}
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          {showCollegeHierarchicalTree && (
            <div className="mb-8">
              <CollegeHierarchyTree
                data={collegeHierarchyData}
                title="College & Institute User Hierarchy"
                type="Institute"
              />
            </div>
          )}
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
                    >
                      <FilterButtonGroup
                        filters={activeDepartmentList}
                        setFilter={(v) => handleFilterChange('department', v)}
                        selected={filters.department}
                        colorPalette={extendedColors}
                        showCount
                        countMap={departmentCountMap}
                        type="Departments"
                      />
                    </AnalyticsChart>
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
                    >
                      <FilterButtonGroup
                        filters={activeDepartmentList}
                        setFilter={(v) => handleFilterChange('department', v)}
                        selected={filters.department}
                        colorPalette={extendedColors}
                        showCount
                        countMap={departmentCountMap}
                        type="Departments"
                      />
                    </AnalyticsChart>
                  </>
                ) : (
                  <>
                    <AnalyticsChart
                      type="pie"
                      data={createPieData(
                        ALL_COLLEGE_NAMES.map(college => ({
                          label: college,
                          value: users.filter(u =>
                            (filters.role === 'all' || u.role === filters.role) &&
                            u.college === college
                          ).length
                        }))
                      )}
                      options={pieOptions}
                      title="College Distribution"
                      icon={BarChart3}
                      iconColor="text-blue-600"
                      badgeText=""
                    >
                      <FilterButtonGroup
                        filters={ALL_COLLEGE_NAMES}
                        setFilter={(v) => handleFilterChange('college', v)}
                        selected={filters.college}
                        colorPalette={extendedColors}
                        showCount
                        countMap={collegeCountMap}
                        type="Colleges"
                      />
                    </AnalyticsChart>
                    {(!isNonInstituteCollegeSelected && activeInstituteList.length > 0) && (
                      <AnalyticsChart
                        type="pie"
                        data={createPieData(
                          activeInstituteList.map(inst => ({
                            label: inst,
                            value: users.filter(
                              u =>
                                (filters.college === "all" || u.college === filters.college) &&
                                u.institute === inst &&
                                u.role !== 'super_admin'
                            ).length
                          }))
                        )}
                        options={pieOptions}
                        title={
                          filters.college === "all"
                            ? "Institute Distribution"
                            : `Institutes in ${filters.college}`
                        }
                        icon={Layers}
                        iconColor="text-green-600"
                        badgeText=""
                      >
                        <FilterButtonGroup
                          filters={activeInstituteList}
                          setFilter={(v) => handleFilterChange('institute', v)}
                          selected={filters.institute}
                          colorPalette={extendedColors}
                          showCount
                          countMap={instituteCountMap}
                          type="Institutes"
                        />
                      </AnalyticsChart>
                    )}
                    <AnalyticsChart
                      type="pie"
                      data={createPieData(statistics.departmentDistribution)}
                      options={pieOptions}
                      title={
                        filters.college === "all"
                          ? "Department Distribution"
                          : isNonInstituteCollegeSelected
                          ? `Departments in ${filters.college}`
                          : filters.institute === "all"
                          ? `Departments in ${filters.college}`
                          : `Departments in ${filters.institute}, ${filters.college}`
                      }
                      icon={Award}
                      iconColor="text-emerald-600"
                      badgeText=""
                    >
                      <FilterButtonGroup
                        filters={activeDepartmentList}
                        setFilter={(v) => handleFilterChange('department', v)}
                        selected={filters.department}
                        colorPalette={extendedColors}
                        showCount
                        countMap={departmentCountMap}
                        type="Departments"
                      />
                    </AnalyticsChart>
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
                      badgeText=""
                    >
                      <FilterButtonGroup
                        filters={activeDepartmentList}
                        setFilter={(v) => handleFilterChange('department', v)}
                        selected={filters.department}
                        colorPalette={extendedColors}
                        showCount
                        countMap={departmentCountMap}
                        type="Departments"
                      />
                    </AnalyticsChart>
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
                  >
                    <FilterButtonGroup
                      filters={ALL_COLLEGE_NAMES}
                      setFilter={(v) => handleFilterChange('college', v)}
                      selected={filters.college}
                      colorPalette={extendedColors}
                      showCount
                      countMap={collegeCountMap}
                      type="Colleges"
                    />
                  </AnalyticsChart>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h5 className="font-semibold text-gray-800 mb-4">Interactive College Summary</h5>
                    <CollegeSummaryGrid summaries={collegeSummaries} />
                  </div>
                </div>
              </TabsContent>
            )}
            {!isCampusAdmin && !isNonInstituteCollegeSelected && (
              <TabsContent value="institutes" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnalyticsChart
                      type="bar"
                      data={createRolesByLocationChart(statistics.rolesByInstitute, activeInstituteList)}
                      options={chartOptions}
                      title="Institute Distribution"
                      icon={BarChart3}
                      iconColor="text-green-600"
                      badgeText=""
                      badgeColor="bg-green-50 text-green-700 border-green-200"
                    >
                      <FilterButtonGroup
                        filters={activeInstituteList}
                        setFilter={(v) => handleFilterChange('institute', v)}
                        selected={filters.institute}
                        colorPalette={extendedColors}
                        showCount
                        countMap={instituteCountMap}
                        type="Institutes"
                      />
                    </AnalyticsChart>
                    <AnalyticsChart
                      type="doughnut"
                      data={createPieData(statistics.instituteDistribution)}
                      options={pieOptions}
                      title="Institute Performance"
                      icon={Network}
                      iconColor="text-purple-600"
                      badgeText=""
                      badgeColor="bg-purple-50 text-purple-700 border-purple-200"
                    >
                      <FilterButtonGroup
                        filters={activeInstituteList}
                        setFilter={(v) => handleFilterChange('institute', v)}
                        selected={filters.institute}
                        colorPalette={extendedColors}
                        showCount
                        countMap={instituteCountMap}
                        type="Institutes"
                      />
                    </AnalyticsChart>
                  </div>
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
                >
                  <FilterButtonGroup
                    filters={activeDepartmentList}
                    setFilter={(v) => handleFilterChange('department', v)}
                    selected={filters.department}
                    colorPalette={extendedColors}
                    showCount
                    countMap={departmentCountMap}
                    type="Departments"
                  />
                </AnalyticsChart>
                <AnalyticsChart
                  type="doughnut"
                  data={createPieData(statistics.departmentDistribution)}
                  options={pieOptions}
                  title="Department Analytics"
                  icon={PieChartIcon}
                  iconColor="text-orange-600"
                  badgeText="Department-wise User Analytics"
                  badgeColor="bg-purple-50 text-purple-700 border-purple-200"
                >
                  <FilterButtonGroup
                    filters={activeDepartmentList}
                    setFilter={(v) => handleFilterChange('department', v)}
                    selected={filters.department}
                    colorPalette={extendedColors}
                    showCount
                    countMap={departmentCountMap}
                    type="Departments"
                  />
                </AnalyticsChart>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}