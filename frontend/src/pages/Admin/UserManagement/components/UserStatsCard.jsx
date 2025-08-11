import { useState, useMemo, useCallback } from 'react';
import { 
  Users, 
  UserCog, 
  Shield, 
  GraduationCap,
  Building,
  Building2,
  Layers,
  BarChart3,
  PieChart as PieChartIcon,
  Eye,
  MapPin,
  Target,
  Award,
  School,
  TreePine,
  Network,
  ChevronRight,
  ChevronDown,
  Filter,
  X,
  RefreshCw,
  Download,
  Calendar,
  Clock,
  User,
  UserCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Bar, Pie, Radar, Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components
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

// Enhanced role configuration
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

// Chart colors - MODIFIED to exclude super_admin
const chartColors = {
  campus_admin: '#3b82f6',
  faculty: '#10b981'
};

// Extended color palette for charts
const extendedColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
  '#14b8a6', '#f59e0b', '#ef4444', '#06b6d4',
  '#84cc16', '#f97316', '#ec4899', '#6366f1', '#14b8a6'
];

// Colleges that don't have institutes
const NON_INSTITUTE_COLLEGES = [
  'EASWARI ENGINEERING COLLEGE',
  'TRP ENGINEERING COLLEGE'
];

// Enhanced filter component - MODIFIED to remove search
const FilterControls = ({ filters, onFilterChange, onReset, stats, showInstituteFilter = true }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 mb-6">
      <div className="space-y-4">
        {/* Filter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-800">Advanced Filters</span>
            <Badge variant="outline" className="text-xs">
              {stats.filtered} / {stats.total} users
            </Badge>
          </div>
          
          <Button
            variant="outline"
            onClick={onReset}
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset All
          </Button>
        </div>
        
        {/* Filter Controls Grid - MODIFIED to remove search */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 ${showInstituteFilter ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
          {/* Role Filter */}
          <div className="w-full">
            <Select value={filters.role} onValueChange={(value) => onFilterChange('role', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="campus_admin">Campus Admin</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* College Filter */}
          <div className="w-full">
            <Select value={filters.college} onValueChange={(value) => onFilterChange('college', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Colleges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colleges</SelectItem>
                <SelectItem value="SRMIST RAMAPURAM">SRMIST RAMAPURAM</SelectItem>
                <SelectItem value="SRM TRICHY">SRM TRICHY</SelectItem>
                <SelectItem value="EASWARI ENGINEERING COLLEGE">EASWARI ENGINEERING COLLEGE</SelectItem>
                <SelectItem value="TRP ENGINEERING COLLEGE">TRP ENGINEERING COLLEGE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Institute Filter - CONDITIONALLY RENDERED */}
          {showInstituteFilter && (
            <div className="w-full">
              <Select value={filters.institute} onValueChange={(value) => onFilterChange('institute', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Institutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutes</SelectItem>
                  <SelectItem value="Science and Humanities">Science and Humanities</SelectItem>
                  <SelectItem value="Engineering and Technology">Engineering and Technology</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                  <SelectItem value="Dental">Dental</SelectItem>
                  <SelectItem value="SRM RESEARCH">SRM RESEARCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Department Filter - ADDED */}
          <div className="w-full">
            <Select value={filters.department} onValueChange={(value) => onFilterChange('department', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Information Technology">Information Technology</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Mechanical">Mechanical</SelectItem>
                <SelectItem value="Civil">Civil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading skeleton component - MODIFIED with blue header
const StatSkeleton = () => (
  <div className="animate-pulse">
    {/* Header skeleton with blue background */}
    <div className="bg-gradient-to-r from-blue-100/50 to-blue-200/50 border-b border-blue-200/30 p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-blue-300/50 rounded-xl"></div>
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-blue-300/50 rounded w-3/4"></div>
          <div className="h-4 bg-blue-300/50 rounded w-1/2"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-blue-300/30 rounded-2xl"></div>
        ))}
      </div>
    </div>
    {/* Content skeleton */}
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-96 bg-gray-200 rounded-2xl"></div>
        ))}
      </div>
    </div>
  </div>
);

// Enhanced metric card (UNCHANGED as requested)
const MetricCard = ({ icon: Icon, title, value, subtitle, color }) => (
  <div className={`relative overflow-hidden rounded-2xl border-2 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 ${color.bg} ${color.border}`}>
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 ${color.text}`} />
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {subtitle && (
            <div className="text-xs text-gray-600">{subtitle}</div>
          )}
        </div>
      </div>
    </div>
    <div className="absolute -bottom-2 -right-2 w-16 h-16 opacity-10">
      <Icon className="w-full h-full" />
    </div>
  </div>
);

// NEW: User Statistics Card Component - MODIFIED with better alignment
const UserStatisticsCard = ({ roleStats }) => (
  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
    <div className="mb-6">
      <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
        <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
        User Statistics Overview
      </h5>
      <p className="text-sm text-gray-600">
        Comprehensive breakdown of all user roles across the platform
      </p>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {Object.entries(roleStats).map(([role, count]) => {
        const config = roleConfig[role];
        if (!config) return null;
        
        return (
          <div 
            key={role} 
            className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${config.bg} ${config.border} overflow-hidden`}
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
            
            {/* Background decoration - FIXED positioning */}
            <div className="absolute -bottom-2 -right-3 w-17 h-17 opacity-10">
              <config.icon className="w-full h-full" />
            </div>
          </div>
        );
      })}
    </div>
    
    {/* Summary section */}
    <div className="mt-6 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Total Active Users:</span>
        <span className="font-semibold text-gray-900">{roleStats.total}</span>
      </div>
    </div>
  </div>
);

// Enhanced and optimized chart with counts - REMOVED DETAILED ANALYSIS
const InteractiveChartWithCounts = ({ 
  chartComponent, 
  data, 
  title, 
  type, 
  onChartClick,
  selectedSegment,
  showCounts = false
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="space-y-6">
      <div className="h-80 relative">
        {chartComponent}
        {hoveredIndex !== null && (
          <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs z-10">
            {data[hoveredIndex]?.label}: {data[hoveredIndex]?.value}
          </div>
        )}
      </div>
    </div>
  );
};

// Hierarchical tree component with search - MODIFIED to exclude super_admin and remove search
const HierarchicalTree = ({ data, title, type }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleExpansion = useCallback((key) => {
    setExpandedItems(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(key)) {
        newExpanded.delete(key);
      } else {
        newExpanded.add(key);
      }
      return newExpanded;
    });
  }, []);

  return (
    <div className="space-y-4">
      <h5 className="font-semibold text-gray-800 flex items-center">
        <TreePine className="w-4 h-4 mr-2 text-green-600" />
        {title}
      </h5>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {Object.entries(data).map(([college, institutes]) => (
          <Collapsible key={college}>
            <CollapsibleTrigger 
              className="flex items-center justify-between w-full p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              onClick={() => toggleExpansion(college)}
            >
              <div className="flex items-center space-x-3">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-800">{college}</span>
                <Badge variant="outline" className="text-xs">
                  {Object.keys(institutes).length} {type}s
                </Badge>
              </div>
              {expandedItems.has(college) ? 
                <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                <ChevronRight className="w-4 h-4 text-gray-500" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 ml-6 space-y-2">
              {Object.entries(institutes).map(([item, roles]) => (
                <div key={item} className="p-3 bg-gray-50 rounded-lg border-l-4 border-green-400">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-3 h-3 text-green-600" />
                      <span className="font-medium text-sm text-gray-800">{item}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {Object.values(roles).filter((count, index) => 
                        Object.keys(roles)[index] !== 'super_admin'
                      ).reduce((sum, count) => sum + count, 0)} users
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(roles).map(([role, count]) => {
                      if (count === 0 || role === 'super_admin') return null; // EXCLUDE SUPER_ADMIN
                      const config = roleConfig[role];
                      return (
                        <div key={role} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center space-x-1">
                            {config && <config.icon className={`w-3 h-3 ${config.text}`} />}
                            <span className="text-xs">{config?.label}</span>
                          </div>
                          <span className="text-xs font-mono">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

// Summary card component - MODIFIED to exclude super_admin
const SummaryCard = ({ location, roles, onClick, isSelected }) => {
  const roleEntries = Object.entries(roles).filter(([role, count]) => 
    count > 0 && role !== 'super_admin' // EXCLUDE SUPER_ADMIN
  );
  const totalUsers = Object.entries(roles)
    .filter(([role]) => role !== 'super_admin') // EXCLUDE SUPER_ADMIN
    .reduce((sum, [, count]) => sum + count, 0);
  
  return (
    <div 
      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50 border border-gray-200'
      }`}
      onClick={() => onClick && onClick(location)}
    >
      <div className="flex items-center justify-between mb-3">
        <h6 className="font-medium text-gray-800 truncate" title={location}>
          {location}
        </h6>
        <Badge variant={isSelected ? "default" : "outline"} className="text-xs">
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
                <config.icon className={`w-3 h-3 ${config.text}`} />
                <span className="text-sm">{config.label}</span>
              </div>
              <Badge variant="outline" className="text-xs">{count}</Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main component - MODIFIED
export default function UserStatsCard({ 
  users = [], 
  roleOptions = [],
  loading = false,
  className = ""
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

  // Check if selected college has institutes - ADDED
  const selectedCollegeHasInstitutes = useMemo(() => {
    if (filters.college === 'all') return true;
    return !NON_INSTITUTE_COLLEGES.includes(filters.college);
  }, [filters.college]);

  // Filter users based on current filters - MODIFIED to remove search
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesRole = filters.role === 'all' || user.role === filters.role;
      const matchesCollege = filters.college === 'all' || user.college === filters.college;
      const matchesInstitute = filters.institute === 'all' || user.institute === filters.institute;
      const matchesDepartment = filters.department === 'all' || user.department === filters.department;
      
      return matchesRole && matchesCollege && matchesInstitute && matchesDepartment;
    });
  }, [users, filters]);

  // Handle filter changes - MODIFIED
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // If college is changed to non-institute college, reset institute filter
      if (key === 'college' && NON_INSTITUTE_COLLEGES.includes(value)) {
        newFilters.institute = 'all';
      }
      
      return newFilters;
    });
    setSelectedSegment(null);
    setSelectedLocation(null);
  }, []);

  // Reset filters
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

  // Handle chart segment clicks - MODIFIED for toggle functionality
  const handleChartClick = useCallback((item, type) => {
    setSelectedSegment(selectedSegment === item.label ? null : item.label);
    
    // Apply filter based on chart click
    if (type === 'colleges') {
      handleFilterChange('college', item.label);
    } else if (type === 'institutes') {
      handleFilterChange('institute', item.label);
    }
  }, [selectedSegment, handleFilterChange]);

  // Handle location clicks
  const handleLocationClick = useCallback((location) => {
    setSelectedLocation(selectedLocation === location ? null : location);
  }, [selectedLocation]);

  // Comprehensive statistics calculation - MODIFIED
  const statistics = useMemo(() => {
    const totalUsers = filteredUsers.length;
    
    // Role distribution - SEPARATE FROM CHARTS
    const roleStats = {
      super_admin: filteredUsers.filter(u => u.role === 'super_admin').length,
      campus_admin: filteredUsers.filter(u => u.role === 'campus_admin').length,
      faculty: filteredUsers.filter(u => u.role === 'faculty').length,
      total: totalUsers
    };

    // College distribution - EXCLUDE SUPER_ADMIN
    const collegeStats = filteredUsers
      .filter(user => user.role !== 'super_admin') // EXCLUDE SUPER_ADMIN
      .reduce((acc, user) => {
        if (user.college && user.college !== 'N/A') {
          acc[user.college] = (acc[user.college] || 0) + 1;
        }
        return acc;
      }, {});

    const collegeDistribution = Object.entries(collegeStats)
      .map(([college, count]) => ({ label: college, value: count }))
      .sort((a, b) => b.value - a.value);

    // Institute distribution - EXCLUDE SUPER_ADMIN
    const instituteStats = filteredUsers
      .filter(user => user.role !== 'super_admin') // EXCLUDE SUPER_ADMIN
      .reduce((acc, user) => {
        if (user.institute && user.institute !== 'N/A' && user.college && !NON_INSTITUTE_COLLEGES.includes(user.college)) {
          acc[user.institute] = (acc[user.institute] || 0) + 1;
        }
        return acc;
      }, {});

    const instituteDistribution = Object.entries(instituteStats)
      .map(([institute, count]) => ({ label: institute, value: count }))
      .sort((a, b) => b.value - a.value);

    // Department distribution - EXCLUDE SUPER_ADMIN
    const departmentStats = filteredUsers
      .filter(user => user.role !== 'super_admin') // EXCLUDE SUPER_ADMIN
      .reduce((acc, user) => {
        if (user.department && user.department !== 'N/A' && user.department.trim() !== '') {
          const dept = user.department.trim();
          acc[dept] = (acc[dept] || 0) + 1;
        }
        return acc;
      }, {});

    const departmentDistribution = Object.entries(departmentStats)
      .map(([department, count]) => ({ label: department, value: count }))
      .sort((a, b) => b.value - a.value);

    // Cross-analysis: Roles by College - EXCLUDE SUPER_ADMIN FROM CHARTS
    const rolesByCollege = {};
    filteredUsers
      .filter(user => user.role !== 'super_admin') // EXCLUDE SUPER_ADMIN
      .forEach(user => {
        if (user.college && user.college !== 'N/A' && user.role) {
          if (!rolesByCollege[user.college]) {
            rolesByCollege[user.college] = { campus_admin: 0, faculty: 0 };
          }
          rolesByCollege[user.college][user.role] = (rolesByCollege[user.college][user.role] || 0) + 1;
        }
      });

    // Enhanced Institute Analysis - EXCLUDE SUPER_ADMIN
    const institutesByCollege = {};
    const rolesByInstitute = {};
    filteredUsers
      .filter(user => user.role !== 'super_admin') // EXCLUDE SUPER_ADMIN
      .forEach(user => {
        if (user.college && user.institute && user.college !== 'N/A' && user.institute !== 'N/A' && user.role && !NON_INSTITUTE_COLLEGES.includes(user.college)) {
          // College -> Institute hierarchy
          if (!institutesByCollege[user.college]) {
            institutesByCollege[user.college] = {};
          }
          if (!institutesByCollege[user.college][user.institute]) {
            institutesByCollege[user.college][user.institute] = { campus_admin: 0, faculty: 0 };
          }
          institutesByCollege[user.college][user.institute][user.role] = 
            (institutesByCollege[user.college][user.institute][user.role] || 0) + 1;

          // Overall institute roles
          if (!rolesByInstitute[user.institute]) {
            rolesByInstitute[user.institute] = { campus_admin: 0, faculty: 0 };
          }
          rolesByInstitute[user.institute][user.role] = (rolesByInstitute[user.institute][user.role] || 0) + 1;
        }
      });

    // Enhanced Department Analysis - EXCLUDE SUPER_ADMIN
    const departmentsByCollege = {};
    const rolesByDepartment = {};
    filteredUsers
      .filter(user => user.role !== 'super_admin') // EXCLUDE SUPER_ADMIN
      .forEach(user => {
        if (user.college && user.department && user.college !== 'N/A' && user.department !== 'N/A' && user.department.trim() !== '' && user.role) {
          const dept = user.department.trim();
          
          // College -> Department hierarchy
          if (!departmentsByCollege[user.college]) {
            departmentsByCollege[user.college] = {};
          }
          if (!departmentsByCollege[user.college][dept]) {
            departmentsByCollege[user.college][dept] = { campus_admin: 0, faculty: 0 };
          }
          departmentsByCollege[user.college][dept][user.role] = 
            (departmentsByCollege[user.college][dept][user.role] || 0) + 1;

          // Overall department roles
          if (!rolesByDepartment[dept]) {
            rolesByDepartment[dept] = { campus_admin: 0, faculty: 0 };
          }
          rolesByDepartment[dept][user.role] = (rolesByDepartment[dept][user.role] || 0) + 1;
        }
      });

    return {
      totalUsers,
      roleStats, // NEW: Separate role statistics
      collegeDistribution,
      instituteDistribution,
      departmentDistribution,
      rolesByCollege,
      rolesByInstitute,
      rolesByDepartment,
      institutesByCollege,
      departmentsByCollege
    };
  }, [filteredUsers]);

  // Chart configurations - MODIFIED to only show campus_admin and faculty
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        // Handle chart click interactions
      }
    },
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
          generateLabels: function(chart) {
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

  // Create chart data - MODIFIED to exclude super_admin
  const createRolesByLocationChart = (data) => {
    const locations = Object.keys(data);
    const roles = ['campus_admin', 'faculty']; // REMOVED super_admin
    
    return {
      labels: locations,
      datasets: roles.map(role => ({
        label: roleConfig[role]?.label || role,
        data: locations.map(location => data[location][role] || 0),
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
        <Card className="border-0 bg-gradient-to-br from-blue-100/30 to-blue-200/30 backdrop-blur-sm overflow-hidden">
          <StatSkeleton />
        </Card>
      </div>
    );
  }

  return (
    <div className={`animate-in fade-in-0 zoom-in-95 duration-500 ${className}`}>
      <Card className="border-0 bg-gradient-to-br from-blue-100/30 to-blue-200/30 backdrop-blur-sm overflow-hidden">
        {/* Enhanced Header - PRIORITY LOADING */}
        <CardHeader className="pb-4 pt-5 bg-gradient-to-r from-blue-100/50 to-blue-200/50 border-b border-blue-200/30">
          <div className="flex flex-col space-y-6">
            {/* Top Row - Title - MODIFIED to remove date/time info */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
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
                <Badge className="bg-gradient-to-r from-blue-600 to-blue-600 text-white px-4 py-2 text-base font-semibold shadow-lg">
                  {statistics.totalUsers} Total Users
                </Badge>
              </div>
            </div>

            {/* Enhanced Filter Controls - MODIFIED */}
            <FilterControls 
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
              stats={{ filtered: statistics.totalUsers, total: users.length }}
              showInstituteFilter={selectedCollegeHasInstitutes}
            />

            {/* Quick Metrics - MODIFIED to include role stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                icon={Building2}
                title="Colleges"
                value={statistics.collegeDistribution.length}
                subtitle="Active institutions"
                color={roleConfig.campus_admin}
              />
              <MetricCard
                icon={Layers}
                title="Institutes"
                value={statistics.instituteDistribution.length}
                subtitle="Academic institutes"
                color={roleConfig.faculty}
              />
              <MetricCard
                icon={Award}
                title="Departments"
                value={statistics.departmentDistribution.length}
                subtitle="Academic units"
                color={roleConfig.super_admin}
              />
              <MetricCard
                icon={Users}
                title="Total Users"
                value={statistics.totalUsers}
                subtitle="All system users"
                color={{ bg: 'bg-gradient-to-br from-gray-50 to-gray-100', text: 'text-gray-800', border: 'border-gray-200' }}
              />
            </div>

            {/* NEW: User Statistics Section - MODIFIED */}
            <UserStatisticsCard roleStats={statistics.roleStats} />
          </div>
        </CardHeader>
        
        <CardContent className="p-6 bg-white/90">
          {/* Enhanced Tabs - MODIFIED to conditionally show institutes tab and add roles tab */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${selectedCollegeHasInstitutes ? 'grid-cols-4' : 'grid-cols-3'} mb-6 bg-gray-100 p-1 rounded-xl`}>
              <TabsTrigger value="overview" className="flex items-center space-x-2 rounded-lg">
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="colleges" className="flex items-center space-x-2 rounded-lg">
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Colleges</span>
              </TabsTrigger>
              {selectedCollegeHasInstitutes && (
                <TabsTrigger value="institutes" className="flex items-center space-x-2 rounded-lg">
                  <Layers className="w-4 h-4" />
                  <span className="hidden sm:inline">Institutes</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="departments" className="flex items-center space-x-2 rounded-lg">
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Departments</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab - MODIFIED to exclude role distribution chart */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Interactive College Distribution */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                  <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-gray-600" />
                    College Distribution
                    <Badge variant="outline" className="ml-2 text-xs">
                      Excludes Super Admin
                    </Badge>
                  </h5>
                  <InteractiveChartWithCounts
                    chartComponent={
                      <Doughnut 
                        data={createPieData(statistics.collegeDistribution)}
                        options={{
                          ...pieOptions,
                          onClick: (event, elements, chart) => {
                            if (elements.length > 0) {
                              const elementIndex = elements[0].index;
                              const label = chart.data.labels[elementIndex];
                              const value = chart.data.datasets[0].data[elementIndex];
                              handleChartClick({ label, value }, 'colleges');
                            }
                          }
                        }}
                      />
                    }
                    data={statistics.collegeDistribution}
                    title="College Distribution"
                    type="colleges"
                    onChartClick={handleChartClick}
                    selectedSegment={selectedSegment}
                    showCounts={false}
                  />
                </div>

                {/* Interactive Department Distribution */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                  <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <Award className="w-4 h-4 mr-2 text-gray-600" />
                    Department Distribution
                    <Badge variant="outline" className="ml-2 text-xs">
                      Excludes Super Admin
                    </Badge>
                  </h5>
                  <InteractiveChartWithCounts
                    chartComponent={
                      <Pie 
                        data={createPieData(statistics.departmentDistribution)}
                        options={pieOptions}
                      />
                    }
                    data={statistics.departmentDistribution}
                    title="Department Distribution"
                    type="departments"
                    onChartClick={handleChartClick}
                    selectedSegment={selectedSegment}
                    showCounts={false}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Enhanced Colleges Tab */}
            <TabsContent value="colleges" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Interactive Bar Chart */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                  <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-blue-600" />
                    Interactive Role Distribution by College
                    <Badge variant="outline" className="ml-2 text-xs">
                      {Object.keys(statistics.rolesByCollege).length} colleges (Excludes Super Admin)
                    </Badge>
                  </h5>
                  <div className="h-96">
                    <Bar 
                      data={createRolesByLocationChart(statistics.rolesByCollege)}
                      options={chartOptions}
                    />
                  </div>
                </div>

                {/* Interactive College Summary - UNCHANGED as requested */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                  <h5 className="font-semibold text-gray-800 mb-4">Interactive College Summary</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(statistics.rolesByCollege).map(([college, roles]) => (
                      <SummaryCard 
                        key={college} 
                        location={college} 
                        roles={roles}
                        onClick={handleLocationClick}
                        isSelected={selectedLocation === college}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Enhanced Institutes Tab - CONDITIONALLY RENDERED */}
            {selectedCollegeHasInstitutes && (
              <TabsContent value="institutes" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                      <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2 text-green-600" />
                        Institute Distribution
                        <Badge variant="outline" className="ml-2 text-xs">
                          Excludes Super Admin
                        </Badge>
                      </h5>
                      <div className="h-80">
                        <Bar 
                          data={createRolesByLocationChart(statistics.rolesByInstitute)}
                          options={chartOptions}
                        />
                      </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                      <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <Network className="w-4 h-4 mr-2 text-purple-600" />
                        Institute Performance
                        <Badge variant="outline" className="ml-2 text-xs">
                          Excludes Super Admin
                        </Badge>
                      </h5>
                      <InteractiveChartWithCounts
                        chartComponent={
                          <Doughnut 
                            data={createPieData(statistics.instituteDistribution)}
                            options={pieOptions}
                          />
                        }
                        data={statistics.instituteDistribution}
                        title="Institute Distribution"
                        type="institutes"
                        onChartClick={handleChartClick}
                        selectedSegment={selectedSegment}
                        showCounts={false}
                      />
                    </div>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                    <HierarchicalTree 
                      data={statistics.institutesByCollege} 
                      title="College → Institute Hierarchy" 
                      type="institute"
                    />
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Enhanced Departments Tab - MODIFIED */}
            <TabsContent value="departments" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                    <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2 text-purple-600" />
                      Department Distribution
                      <Badge variant="outline" className="ml-2 text-xs">
                        Excludes Super Admin
                      </Badge>
                    </h5>
                    <div className="h-80">
                      <Bar 
                        data={createRolesByLocationChart(statistics.rolesByDepartment)}
                        options={{
                          ...chartOptions,
                          indexAxis: 'y',
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                    <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <PieChartIcon className="w-4 h-4 mr-2 text-orange-600" />
                      Department Analytics
                      <Badge variant="outline" className="ml-2 text-xs">
                        Excludes Super Admin
                      </Badge>
                    </h5>
                    <InteractiveChartWithCounts
                      chartComponent={
                        <Doughnut 
                          data={createPieData(statistics.departmentDistribution)}
                          options={pieOptions}
                        />
                      }
                      data={statistics.departmentDistribution}
                      title="Department Size"
                      type="departments"
                      onChartClick={handleChartClick}
                      selectedSegment={selectedSegment}
                      showCounts={false}
                    />
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                  <HierarchicalTree 
                    data={statistics.departmentsByCollege} 
                    title="College → Department Hierarchy" 
                    type="department"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}