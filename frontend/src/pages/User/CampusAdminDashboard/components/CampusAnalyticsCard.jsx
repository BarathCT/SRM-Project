import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  BookOpen,
  Award
} from "lucide-react";
import { SUBJECT_AREAS } from "@/utils/subjectAreas";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const colorPalette = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
  '#F97316', '#EC4899', '#6366F1', '#84CC16', '#F472B6', '#F43F5E'
];

const qRatings = ['Q1', 'Q2', 'Q3', 'Q4'];
const qColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

// --- Chart options ---
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: 'rgba(59, 130, 246, 0.5)',
      borderWidth: 1
    }
  }
};

const barChartOptions = {
  ...chartOptions,
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(59, 130, 246, 0.1)' },
      ticks: { color: '#6B7280' }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#6B7280' }
    }
  }
};

function getPublishedSubjectAreas(subjectDistribution) {
  return Object.entries(subjectDistribution || {})
    .filter(([, count]) => count > 0)
    .map(([area]) => area);
}

// --- Custom Filter ButtonGroup for filled/outline style ---
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
    <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center mt-2 sm:mt-3 mb-2">
      <button
        type="button"
        onClick={() => setFilter("all")}
        className="text-xs px-2 sm:px-3 py-1 rounded-full border transition"
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
            onClick={() => setFilter(prev => prev === v ? "all" : v)}
            className="text-xs px-2 sm:px-3 py-1 rounded-full border transition"
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

// Helper to find color index
function getIndex(arr, value) {
  return arr.findIndex(v => v === value);
}

export default function CampusAnalyticsCard({ stats, loading }) {
  const [subjectAreaFilter, setSubjectAreaFilter] = useState("all");
  const [subjectCategoryFilter, setSubjectCategoryFilter] = useState("all");
  const [qRatingFilter, setQRatingFilter] = useState("all");

  // --- Q-Rating Total ---
  const qRatingTotal = useMemo(() => {
    if (!stats || !stats.qDistribution) return 0;
    if (qRatingFilter === "all") {
      return Object.values(stats.qDistribution).reduce((sum, v) => sum + v, 0);
    }
    return stats.qDistribution[qRatingFilter] || 0;
  }, [stats, qRatingFilter]);

  // --- Subject Category List for selected Area ---
  const allPublishedCategories = useMemo(() => {
    if (
      subjectAreaFilter !== "all" &&
      stats.subjectCategoryDistribution &&
      stats.subjectCategoryDistribution[subjectAreaFilter]
    ) {
      return Object.entries(stats.subjectCategoryDistribution[subjectAreaFilter])
        .filter(([, count]) => count > 0)
        .map(([cat]) => cat);
    }
    return [];
  }, [stats.subjectCategoryDistribution, subjectAreaFilter]);

  // --- Subject Area Total ---
  const subjectAreaTotal = useMemo(() => {
    if (!stats || !stats.subjectDistribution) return 0;
    if (subjectAreaFilter === "all") {
      return Object.values(stats.subjectDistribution).reduce((sum, v) => sum + v, 0);
    }
    return stats.subjectDistribution[subjectAreaFilter] || 0;
  }, [stats, subjectAreaFilter]);

  // --- Subject Category Total ---
  const subjectCategoryTotal = useMemo(() => {
    if (
      subjectAreaFilter !== "all" &&
      subjectCategoryFilter !== "all" &&
      stats.subjectCategoryDistribution &&
      stats.subjectCategoryDistribution[subjectAreaFilter]
    ) {
      return stats.subjectCategoryDistribution[subjectAreaFilter][subjectCategoryFilter] || 0;
    }
    if (
      subjectAreaFilter !== "all" &&
      stats.subjectCategoryDistribution &&
      stats.subjectCategoryDistribution[subjectAreaFilter]
    ) {
      return Object.values(stats.subjectCategoryDistribution[subjectAreaFilter]).reduce((sum, v) => sum + v, 0);
    }
    return 0;
  }, [stats, subjectAreaFilter, subjectCategoryFilter]);

  // --- Q-Rating chart data: colors now match filter ---
  const qRatingData = useMemo(() => {
    if (!stats || loading) return null;
    if (qRatingFilter === "all") {
      return {
        labels: qRatings,
        datasets: [{
          data: qRatings.map(q => stats.qDistribution?.[q] || 0),
          backgroundColor: qColors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      };
    } else {
      const idx = getIndex(qRatings, qRatingFilter);
      return {
        labels: [qRatingFilter],
        datasets: [{
          data: [stats.qDistribution?.[qRatingFilter] || 0],
          backgroundColor: [qColors[idx >= 0 ? idx : 0]],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      };
    }
  }, [stats, qRatingFilter, loading]);

  // --- Chart Data (subject area/category colors now match filter) ---
  const chartData = useMemo(() => {
    if (!stats || loading) return null;

    // Yearly Trend
    const years = Object.keys(stats.yearlyTrend || {}).sort();
    const yearlyTrendData = {
      labels: years,
      datasets: [{
        label: 'Publications',
        data: years.map(year => stats.yearlyTrend[year]),
        backgroundColor: '#3B82F6',
        borderColor: '#1D4ED8',
        borderWidth: 2
      }]
    };

    // Subject Area Distribution
    const allPublishedAreas = getPublishedSubjectAreas(stats.subjectDistribution);
    let filteredAreas, areaColors;
    if (subjectAreaFilter === "all") {
      filteredAreas = allPublishedAreas;
      areaColors = colorPalette.slice(0, filteredAreas.length);
    } else {
      filteredAreas = [subjectAreaFilter];
      const idx = allPublishedAreas.findIndex(v => v === subjectAreaFilter);
      areaColors = [colorPalette[idx >= 0 ? idx : 0]];
    }
    const subjectAreaData = {
      labels: filteredAreas,
      datasets: [{
        data: filteredAreas.map(area => stats.subjectDistribution[area] || 0),
        backgroundColor: areaColors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    // Subject Category Distribution for selected area (if any)
    let subjectCategoryData = null;
    if (subjectAreaFilter !== "all" && stats.subjectCategoryDistribution) {
      const allCats = Object.entries(stats.subjectCategoryDistribution[subjectAreaFilter] || {})
        .filter(([, count]) => count > 0)
        .map(([cat]) => cat);

      let filteredCats, catColors;
      if (subjectCategoryFilter === "all") {
        filteredCats = allCats;
        catColors = colorPalette.slice(0, filteredCats.length);
      } else {
        filteredCats = [subjectCategoryFilter];
        const idx = allCats.findIndex(v => v === subjectCategoryFilter);
        catColors = [colorPalette[idx >= 0 ? idx : 0]];
      }

      subjectCategoryData = {
        labels: filteredCats,
        datasets: [{
          data: filteredCats.map(cat =>
            stats.subjectCategoryDistribution?.[subjectAreaFilter]?.[cat] || 0
          ),
          backgroundColor: catColors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      };
    }

    // Department Stats
    const deptEntries = Object.entries(stats.departmentStats || {});
    const departmentData = {
      labels: deptEntries.map(([dept]) => dept),
      datasets: [
        {
          label: 'Total Publications',
          data: deptEntries.map(([, data]) => data.papers),
          backgroundColor: '#3B82F6',
          borderColor: '#1D4ED8',
          borderWidth: 1
        },
        {
          label: 'Q1 Publications',
          data: deptEntries.map(([, data]) => data.q1Papers),
          backgroundColor: '#10B981',
          borderColor: '#059669',
          borderWidth: 1
        }
      ]
    };

    return {
      qRatingData,
      yearlyTrendData,
      subjectAreaData,
      subjectCategoryData,
      departmentData,
      allPublishedAreas,
    };
  }, [stats, loading, subjectAreaFilter, subjectCategoryFilter, allPublishedCategories, qRatingData]);

  if (loading) {
    return (
      <Card className="border border-gray-200 bg-white">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Campus Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData) return null;

  // --- Count maps for legends ---
  const qRatingCountMap = stats.qDistribution || {};
  const subjectAreaCountMap = stats.subjectDistribution || {};
  const subjectCategoryCountMap = (subjectAreaFilter !== "all"
    ? stats.subjectCategoryDistribution?.[subjectAreaFilter] || {}
    : {});

  // --- Q-rating filter button group (filled/outline style) ---
  const renderQRatingLegend = () => (
    <FilterButtonGroup
      filters={qRatings}
      setFilter={setQRatingFilter}
      selected={qRatingFilter}
      colorPalette={qColors}
      type="Q Ratings"
      showCount={true}
      countMap={qRatingCountMap}
    />
  );

  // --- Subject area legend buttons (filled/outline style) ---
  const renderSubjectAreaLegend = () => (
    <FilterButtonGroup
      filters={chartData.allPublishedAreas}
      setFilter={(area) => {
        setSubjectAreaFilter(area);
        setSubjectCategoryFilter("all");
      }}
      selected={subjectAreaFilter}
      colorPalette={colorPalette}
      type="Subject Areas"
      showCount={true}
      countMap={subjectAreaCountMap}
    />
  );

  // --- Subject category legend buttons (filled/outline style) ---
  const renderSubjectCategoryLegend = () => {
    if (
      subjectAreaFilter === "all" ||
      !allPublishedCategories.length
    ) return null;
    return (
      <FilterButtonGroup
        filters={allPublishedCategories}
        setFilter={setSubjectCategoryFilter}
        selected={subjectCategoryFilter}
        colorPalette={colorPalette}
        type="Categories"
        showCount={true}
        countMap={subjectCategoryCountMap}
      />
    );
  };

  // --- Show subject category chart only if a subject area is selected and there are categories ---
  const showCategoryChart =
    subjectAreaFilter !== "all" &&
    chartData.subjectCategoryData &&
    chartData.subjectCategoryData.labels.length > 0;

  // --- Badge card for area/category/QRating top-right ---
  function BadgeCard({ label, count }) {
    return (
      <div className="absolute top-2 sm:top-3 right-2 sm:right-4 bg-blue-50 border border-blue-200 rounded-lg px-2 sm:px-3 py-1 flex items-center gap-1 sm:gap-2 z-10">
        <span className="text-xs font-semibold text-blue-700 truncate max-w-[120px] sm:max-w-none">{label}</span>
        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 sm:px-2 rounded-full flex-shrink-0">
          {count}
        </span>
      </div>
    );
  }

  return (
    <Card className="border border-gray-200 bg-white">
      <CardHeader className="bg-white-50 border-b border-blue-100">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Campus Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 sm:mb-6 bg-gray-50 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3">
              <PieChart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Over</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Subjects</span>
              <span className="sm:hidden">Subj</span>
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3">
              <Award className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Departments</span>
              <span className="sm:hidden">Dept</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="relative">
                <BadgeCard
                  label={qRatingFilter === "all" ? "All Q Ratings" : qRatingFilter}
                  count={qRatingTotal}
                />
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 text-center">
                  Q-Rating Distribution
                </h4>
                <div className="h-48 sm:h-64">
                  <Doughnut data={qRatingData} options={chartOptions} />
                </div>
                {renderQRatingLegend()}
              </div>
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 text-center">
                  Quality Metrics
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                    <span className="text-xs sm:text-sm text-gray-700">Q1 Publications</span>
                    <span className="font-semibold text-blue-700 text-xs sm:text-sm">
                      {stats.qDistribution?.Q1 || 0} ({stats.q1Percentage}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-green-50 rounded-lg">
                    <span className="text-xs sm:text-sm text-gray-700">Q2 Publications</span>
                    <span className="font-semibold text-green-700 text-xs sm:text-sm">
                      {stats.qDistribution?.Q2 || 0} ({stats.q2Percentage}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-orange-50 rounded-lg">
                    <span className="text-xs sm:text-sm text-gray-700">Q3 Publications</span>
                    <span className="font-semibold text-orange-700 text-xs sm:text-sm">
                      {stats.qDistribution?.Q3 || 0} ({stats.q3Percentage}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 sm:p-3 bg-red-50 rounded-lg">
                    <span className="text-xs sm:text-sm text-gray-700">Q4 Publications</span>
                    <span className="font-semibold text-red-700 text-xs sm:text-sm">
                      {stats.qDistribution?.Q4 || 0} ({stats.q4Percentage}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-3 sm:space-y-4">
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 text-center">
                Yearly Publication Trend
              </h4>
              <div className="h-64 sm:h-80">
                <Bar data={chartData.yearlyTrendData} options={barChartOptions} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
              {/* Subject Area Card */}
              <div className="relative">
                <BadgeCard
                  label={subjectAreaFilter === "all"
                    ? "All Subject Areas"
                    : subjectAreaFilter}
                  count={subjectAreaTotal}
                />
                <Card className="border border-gray-200 bg-white w-full">
                  <CardHeader className="pb-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-700 text-center">
                      Subject Area Distribution
                    </h4>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    <div className="h-56 sm:h-72">
                      <Pie data={chartData.subjectAreaData} options={chartOptions} />
                    </div>
                    {renderSubjectAreaLegend()}
                  </CardContent>
                </Card>
              </div>
              {/* Subject Category Card (only if a subject area is selected) */}
              {showCategoryChart && (
                <div className="relative">
                  <BadgeCard
                    label={subjectCategoryFilter === "all"
                      ? "All Categories"
                      : subjectCategoryFilter}
                    count={subjectCategoryTotal}
                  />
                  <Card className="border border-gray-200 bg-white w-full">
                    <CardHeader className="pb-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-700 text-center">
                        Subject Categories in {subjectAreaFilter}
                      </h4>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                      <div className="h-56 sm:h-72">
                        <Pie data={chartData.subjectCategoryData} options={chartOptions} />
                      </div>
                      {renderSubjectCategoryLegend()}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="departments" className="space-y-3 sm:space-y-4">
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 text-center">
                Department-wise Publication Stats
              </h4>
              <div className="h-64 sm:h-80">
                <Bar data={chartData.departmentData} options={barChartOptions} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}