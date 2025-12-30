import { useState, useMemo, useCallback, useEffect } from 'react';
import axios from 'axios';
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

// --- OPTIMIZED FILTER BUTTON GROUP ---
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
  const totalCount = showCount ? Object.values(countMap || {}).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0) : 0;
  const hasManyFilters = filters.length > 8;
  
  return (
    <div className="mt-3 mb-2">
      {/* All button - always visible */}
      <div className="flex justify-center mb-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className="text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95"
          style={{
            background: selected === "all" ? filledColor : "transparent",
            color: selected === "all" ? filledTextColor : textColor,
            borderColor: selected === "all" ? filledColor : outlineColor,
            fontWeight: selected === "all" ? 600 : 500,
            boxShadow: selected === "all" ? "0 2px 4px rgba(37, 99, 235, 0.2)" : "none",
          }}
        >
          All {type}
          {showCount && (
            <span
              className="ml-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: selected === "all" ? "rgba(255,255,255,0.25)" : countBg,
                color: selected === "all" ? "#fff" : filledColor
              }}
            >
              {totalCount}
            </span>
          )}
        </button>
      </div>
      
      {/* Filter buttons - scrollable if many */}
      <div className={`${hasManyFilters ? 'max-h-32 overflow-y-auto pr-1' : ''} scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100`}>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {filters.map((v, idx) => {
            const isActive = selected === v;
            const color = colorPalette[idx % colorPalette.length] || filledColor;
            const count = showCount ? ((countMap && countMap[v]) || 0) : null;
            
            return (
              <button
                key={v}
                type="button"
                onClick={() => setFilter(v)}
                className="text-xs px-2.5 py-1 rounded-full border transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                style={{
                  background: isActive ? color : "transparent",
                  color: isActive ? "#fff" : color,
                  borderColor: color,
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive ? `0 2px 4px ${color}40` : "none",
                  opacity: count === 0 ? 0.6 : 1,
                }}
                title={v}
              >
                <span className="truncate max-w-[120px]">{v}</span>
                {showCount && count !== null && (
                  <span
                    className="flex-shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.25)" : countBg,
                      color: isActive ? "#fff" : color
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function UserStatsCard({
  // users prop is no longer needed for stats, but might be passed by parent. We ignore it for stats.
  users = [],
  totalUsers = 0,
  roleOptions = [],
  loading: parentLoading = false,
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

  // Local loading state for stats fetching
  const [statsLoading, setStatsLoading] = useState(false);

  // Statistics State (initialized with empty skeletons)
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    roleStats: { super_admin: 0, campus_admin: 0, faculty: 0, total: 0 },
    collegeDistribution: [],
    instituteDistribution: [],
    departmentDistribution: [],
    rolesByCollege: {},
    rolesByInstitute: {},
    rolesByDepartment: {}
  });

  // Store unfiltered statistics for count maps (so counts don't become zero when filtering)
  const [unfilteredStatistics, setUnfilteredStatistics] = useState({
    collegeDistribution: [],
    instituteDistribution: [],
    departmentDistribution: []
  });

  const currentUserRole = currentUser?.role || 'super_admin';
  const isCampusAdmin = currentUserRole === 'campus_admin';

  // Fetch stats from server
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      // Build query params
      const params = new URLSearchParams();
      if (filters.role !== 'all') params.append('role', filters.role);
      if (filters.college !== 'all') params.append('college', filters.college);
      if (filters.institute !== 'all') params.append('institute', filters.institute);
      if (filters.department !== 'all') params.append('department', filters.department);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_BASE_URL}/api/admin/stats?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // 10 second timeout
      });

      // Validate response data structure
      if (response.data && typeof response.data === 'object') {
        const newStats = {
          totalUsers: response.data.totalUsers || 0,
          activeUsers: response.data.activeUsers || 0,
          roleStats: response.data.roleStats || { super_admin: 0, campus_admin: 0, faculty: 0, total: 0 },
          collegeDistribution: Array.isArray(response.data.collegeDistribution) ? response.data.collegeDistribution : [],
          instituteDistribution: Array.isArray(response.data.instituteDistribution) ? response.data.instituteDistribution : [],
          departmentDistribution: Array.isArray(response.data.departmentDistribution) ? response.data.departmentDistribution : [],
          rolesByCollege: response.data.rolesByCollege && typeof response.data.rolesByCollege === 'object' ? response.data.rolesByCollege : {},
          rolesByInstitute: response.data.rolesByInstitute && typeof response.data.rolesByInstitute === 'object' ? response.data.rolesByInstitute : {},
          rolesByDepartment: response.data.rolesByDepartment && typeof response.data.rolesByDepartment === 'object' ? response.data.rolesByDepartment : {}
        };
        setStatistics(newStats);
        
        // Store unfiltered statistics only when no filters are applied (for count maps)
        const hasFilters = filters.role !== 'all' || filters.college !== 'all' || filters.institute !== 'all' || filters.department !== 'all' || filters.search;
        if (!hasFilters) {
          setUnfilteredStatistics({
            collegeDistribution: newStats.collegeDistribution,
            instituteDistribution: newStats.instituteDistribution,
            departmentDistribution: newStats.departmentDistribution
          });
        }
      } else {
        console.error("Invalid response data structure:", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
      // Reset to empty state on error
      setStatistics({
        totalUsers: 0,
        activeUsers: 0,
        roleStats: { super_admin: 0, campus_admin: 0, faculty: 0, total: 0 },
        collegeDistribution: [],
        instituteDistribution: [],
        departmentDistribution: [],
        rolesByCollege: {},
        rolesByInstitute: {},
        rolesByDepartment: {}
      });
    } finally {
      setStatsLoading(false);
    }
  }, [filters]);

  // Fetch on mount and when filters change
  // Debounce search filter? For now direct dependency.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
    }, 300); // 300ms debounce for all filter changes including search
    return () => clearTimeout(timer);
  }, [fetchStats]);

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

  // Chart configs
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // hide legend, we use clickable labels below chart
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
          drawBorder: false
        },
        ticks: {
          font: { size: 11 },
          color: '#6b7280'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 11 },
          color: '#6b7280',
          maxRotation: 45,
          minRotation: 0
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
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    onClick: () => { }
  };

  // Chart Data Creators
  const createRolesByDepartmentChart = (data) => {
    const departments = activeDepartmentList;
    const roles = ['campus_admin', 'faculty'];
    
    // Check if data exists and has any actual values
    const hasData = data && typeof data === 'object' && Object.keys(data).length > 0;
    
    if (!hasData) {
      // Return empty chart data if data is invalid
      return {
        labels: departments.length > 0 ? departments.slice(0, 10) : ['No Departments'],
        datasets: roles.map(role => ({
          label: roleConfig[role]?.label || role,
          data: departments.length > 0 ? departments.slice(0, 10).map(() => 0) : [0],
          backgroundColor: chartColors[role],
          borderColor: chartColors[role],
          borderWidth: 1
        }))
      };
    }
    
    // Check if there's any actual data (non-zero values) in the entire data object
    const hasAnyData = Object.values(data).some(deptData => {
      if (!deptData || typeof deptData !== 'object') return false;
      return (deptData.campus_admin || 0) + (deptData.faculty || 0) > 0;
    });
    
    // If there's data but not in activeDepartmentList, use all departments from data
    if (hasAnyData) {
      const allDepartmentsWithData = Object.keys(data).filter(dept => {
        const deptData = data[dept];
        if (!deptData || typeof deptData !== 'object') return false;
        return (deptData.campus_admin || 0) + (deptData.faculty || 0) > 0;
      });
      
      // Filter departments: prefer those with data from activeDepartmentList, 
      // but also include any departments from data that have values
      const departmentsWithData = departments.filter(dept => {
        const deptData = data[dept];
        if (!deptData || typeof deptData !== 'object') return false;
        return (deptData.campus_admin || 0) + (deptData.faculty || 0) > 0;
      });
      
      // Combine: use active departments with data first, then add any other departments with data
      const combinedDepartments = [...new Set([...departmentsWithData, ...allDepartmentsWithData])];
      
      // Use departments with data if available, otherwise use first 10 departments
      const finalDepartments = combinedDepartments.length > 0 
        ? combinedDepartments.slice(0, 20) // Limit to 20 for performance
        : (departments.length > 0 ? departments.slice(0, 10) : ['No Departments']);
      
      return {
        labels: finalDepartments,
        datasets: roles.map(role => ({
          label: roleConfig[role]?.label || role,
          data: finalDepartments.map(department => {
            const deptData = data[department];
            if (!deptData || typeof deptData !== 'object') return 0;
            const value = deptData[role];
            return typeof value === 'number' ? value : 0;
          }),
          backgroundColor: chartColors[role],
          borderColor: chartColors[role],
          borderWidth: 1
        }))
      };
    }
    
    // No data at all - return empty chart
    const finalDepartments = departments.length > 0 ? departments.slice(0, 10) : ['No Departments'];
    
    return {
      labels: finalDepartments,
      datasets: roles.map(role => ({
        label: roleConfig[role]?.label || role,
        data: finalDepartments.map(department => {
          const deptData = data[department];
          if (!deptData || typeof deptData !== 'object') return 0;
          const value = deptData[role];
          return typeof value === 'number' ? value : 0;
        }),
        backgroundColor: chartColors[role],
        borderColor: chartColors[role],
        borderWidth: 1
      }))
    };
  };

  const createRolesByLocationChart = (data, allLocations) => {
    const locations = Array.isArray(allLocations) ? allLocations : [];
    const roles = ['campus_admin', 'faculty'];
    
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      // Return empty chart data if data is invalid
      return {
        labels: locations.length > 0 ? locations : ['No Data'],
        datasets: roles.map(role => ({
          label: roleConfig[role]?.label || role,
          data: locations.length > 0 ? locations.map(() => 0) : [0],
          backgroundColor: chartColors[role],
          borderColor: chartColors[role],
          borderWidth: 1
        }))
      };
    }
    
    // Filter out locations with zero counts for better visualization
    const locationsWithData = locations.filter(location => {
      const locationData = data[location];
      if (!locationData || typeof locationData !== 'object') return false;
      return (locationData.campus_admin || 0) + (locationData.faculty || 0) > 0;
    });
    
    const finalLocations = locationsWithData.length > 0 ? locationsWithData : locations.slice(0, 15);
    
    return {
      labels: finalLocations,
      datasets: roles.map(role => ({
        label: roleConfig[role]?.label || role,
        data: finalLocations.map(location => {
          const locationData = data[location];
          if (!locationData || typeof locationData !== 'object') return 0;
          const value = locationData[role];
          return typeof value === 'number' ? value : 0;
        }),
        backgroundColor: chartColors[role],
        borderColor: chartColors[role],
        borderWidth: 1
      }))
    };
  };

  const createPieData = (distribution, selectedLabel = null) => {
    // Handle empty or invalid distribution
    if (!Array.isArray(distribution) || distribution.length === 0) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      };
    }
    
    // If a label is selected, highlight it and gray out others
    const colors = distribution.map((item, index) => {
      const label = item?.label || 'Unknown';
      const originalColor = extendedColors[index % extendedColors.length];
      
      if (selectedLabel && selectedLabel !== 'all') {
        // Highlight selected segment, gray out others
        return label === selectedLabel ? originalColor : '#d1d5db'; // gray-300
      }
      
      return originalColor;
    });
    
    return {
      labels: distribution.map(item => item?.label || 'Unknown'),
      datasets: [{
        data: distribution.map(item => item?.value || 0),
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  };

  // COUNT MAPS for all chart filter groups - use unfiltered statistics so counts don't become zero
  const collegeCountMap = useMemo(() => {
    const map = {};
    const distribution = unfilteredStatistics.collegeDistribution.length > 0 
      ? unfilteredStatistics.collegeDistribution 
      : statistics.collegeDistribution;
    if (Array.isArray(distribution)) {
      distribution.forEach(item => {
        if (item && item.label) {
          map[item.label] = item.value || 0;
        }
      });
    }
    return map;
  }, [unfilteredStatistics.collegeDistribution, statistics.collegeDistribution]);

  const instituteCountMap = useMemo(() => {
    const map = {};
    const distribution = unfilteredStatistics.instituteDistribution.length > 0 
      ? unfilteredStatistics.instituteDistribution 
      : statistics.instituteDistribution;
    if (Array.isArray(distribution)) {
      distribution.forEach(item => {
        if (item && item.label) {
          map[item.label] = item.value || 0;
        }
      });
    }
    return map;
  }, [unfilteredStatistics.instituteDistribution, statistics.instituteDistribution]);

  const departmentCountMap = useMemo(() => {
    const map = {};
    const distribution = unfilteredStatistics.departmentDistribution.length > 0 
      ? unfilteredStatistics.departmentDistribution 
      : statistics.departmentDistribution;
    if (Array.isArray(distribution)) {
      distribution.forEach(item => {
        if (item && item.label) {
          map[item.label] = item.value || 0;
        }
      });
    }
    return map;
  }, [unfilteredStatistics.departmentDistribution, statistics.departmentDistribution]);

  // College Hierarchical Tree
  const collegeHierarchyData = useMemo(() => {
    const tree = {};
    const { rolesByCollege, rolesByInstitute } = statistics;

    // Process Institutes
    if (rolesByInstitute && typeof rolesByInstitute === 'object') {
      Object.entries(rolesByInstitute).forEach(([institute, roles]) => {
        // Skip if institute is "N/A" or empty
        if (!institute || institute === "N/A") return;
        
        // Find college for this institute
        const collegeOption = COLLEGE_OPTIONS.find(c =>
          c.institutes && c.institutes.some(i => i.name === institute)
        );
        const collegeName = collegeOption ? collegeOption.name : null;
        
        // Only add if we found a valid college
        if (collegeName) {
          if (!tree[collegeName]) tree[collegeName] = {};
          tree[collegeName][institute] = roles || {};
        }
      });
    }

    // Process non-institute colleges
    if (rolesByCollege && typeof rolesByCollege === 'object') {
      Object.entries(rolesByCollege).forEach(([college, roles]) => {
        // Skip if college is "N/A" or empty
        if (!college || college === "N/A") return;
        
        if (collegesWithoutInstitutes.includes(college)) {
          if (!tree[college]) tree[college] = {};
          tree[college][college] = roles || {};
        }
      });
    }

    return tree;
  }, [statistics]);

  // College Hierarchical Tree: show only for super admin and not filtering for super_admin
  const showCollegeHierarchicalTree =
    currentUserRole === 'super_admin' && filters.role !== 'super_admin';

  const collegeSummaries = useMemo(() => {
    if (!statistics.rolesByCollege || typeof statistics.rolesByCollege !== 'object') {
      return [];
    }
    return Object.keys(statistics.rolesByCollege)
      .filter(college => college && college !== "N/A")
      .map(college => {
        const roles = statistics.rolesByCollege[college] || {};
        return (
          <SummaryCard
            key={college}
            location={college}
            roles={{
              campus_admin: roles.campus_admin || 0,
              faculty: roles.faculty || 0
            }}
            onClick={handleLocationClick}
            isSelected={selectedLocation === college}
          />
        );
      });
  }, [statistics.rolesByCollege, selectedLocation, handleLocationClick]);

  if (parentLoading || statsLoading) {
    return (
      <div className={`animate-in fade-in-0 zoom-in-95 duration-500 ${className}`}>
        <Card className="border border-gray-200 bg-white overflow-hidden">
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

  return (
    <div className={`animate-in fade-in-0 zoom-in-95 duration-500 ${className}`}>
      <Card className="border border-gray-200 bg-white overflow-hidden">
        {/* Header */}
        <CardHeader className="pb-4 pt-5 bg-gradient-to-r from-white to-blue-50/80 border-b border-blue-100">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <BarChart3 className="h-6 w-6 text-blue-600" />
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
                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 text-base font-semibold">
                  {totalUsers || statistics.totalUsers} Total Users
                </Badge>
              </div>
            </div>
            <FilterControls
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
              stats={{ filtered: statistics.totalUsers, total: totalUsers || users.length }}
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
            <TabsList className={`grid w-full mb-6 bg-gray-50 p-1 rounded-xl ${
              chartTabs.length === 2 ? 'grid-cols-2' :
              chartTabs.length === 3 ? 'grid-cols-3' :
              chartTabs.length === 4 ? 'grid-cols-4' : 'grid-cols-2'
            }`}>
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
                      data={createPieData(statistics.departmentDistribution, filters.department)}
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
                      data={createPieData(statistics.collegeDistribution || [], filters.college)}
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
                          activeInstituteList.map(inst => {
                            // Find the count from statistics.instituteDistribution
                            const instData = statistics.instituteDistribution?.find(item => item.label === inst);
                            return {
                              label: inst,
                              value: instData?.value || 0
                            };
                          }).filter(item => item.value > 0), // Only show institutes with users
                          filters.institute
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
                      data={createPieData(statistics.departmentDistribution, filters.department)}
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
                    data={createRolesByLocationChart(statistics.rolesByCollege || {}, allColleges)}
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
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
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
                      data={createPieData(statistics.instituteDistribution, filters.institute)}
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
                  data={createPieData(statistics.departmentDistribution, filters.department)}
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