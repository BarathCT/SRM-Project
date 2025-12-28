import React, { useMemo, useState } from "react";
import AnalyticsChart from "../../../Admin/UserManagement/components/UserStats/charts/AnalyticsChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Building, Layers, TrendingUp } from "lucide-react";
import {
  ALL_COLLEGE_NAMES,
  getAllInstituteNames,
  getAllDepartmentNames,
} from "@/utils/collegeData";

const colorPalette = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4",
  "#F97316", "#EC4899", "#22C55E", "#0EA5E9", "#A855F7", "#84CC16", "#EAB308"
];

const qKeys = ["Q1", "Q2", "Q3", "Q4"];
const qColors = ["#3B82F6", "#10B981", "#F59E0B", "#6B7280"];

function FilterButtonGroup({
  filters,
  setFilter,
  selected,
  colorPalette = [],
  showCount,
  countMap,
  type
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-3">
      <button
        type="button"
        onClick={() => setFilter("all")}
        className={`text-xs px-3 py-1 rounded-full border transition`}
        style={{
          background: selected === "all" ? "#111827" : "transparent",
          color: selected === "all" ? "#fff" : "#374151",
          borderColor: selected === "all" ? "#111827" : "#d1d5db",
          fontWeight: selected === "all" ? 600 : 400,
        }}
      >
        All {type}
        {showCount && (
          <span className="ml-1 inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 rounded-full">
            {Object.values(countMap || {}).reduce((sum, v) => sum + v, 0)}
          </span>
        )}
      </button>
      {filters.map((v, idx) => {
        const isActive = selected === v;
        const color = colorPalette[idx % colorPalette.length] || "#222";
        return (
          <button
            key={v}
            type="button"
            onClick={() => setFilter(prev => prev === v ? "all" : v)}
            className={`text-xs px-3 py-1 rounded-full border transition`}
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
                className={`ml-1 inline-block text-xs font-semibold px-2 rounded-full`}
                style={{
                  background: isActive ? "rgba(255,255,255,0.2)" : "#eff6ff",
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

export default function SuperAdminAnalyticsCard({
  papers = [],
  users = [],
  loading = false,
}) {
  // SEPARATE FILTERS for each chart in the "college" tab
  const [collegeBarFilter, setCollegeBarFilter] = useState("all");
  const [qRatingBarFilter, setQRatingBarFilter] = useState("all");
  // Shared filter for the other tabs
  const [collegeFilter, setCollegeFilter] = useState("all");

  // Map papers to faculty info
  const facultyMap = useMemo(() => {
    const m = new Map();
    for (const u of users) {
      if (u?.facultyId) m.set(u.facultyId, u);
    }
    return m;
  }, [users]);

  // College Bar Chart
  const collegeLabels = ALL_COLLEGE_NAMES;
  const collegeCounts = useMemo(() => {
    const map = {};
    for (const p of papers) {
      const f = facultyMap.get(p.facultyId);
      const college = f?.college || p.college || "N/A";
      // If filtering, only count that college
      if (collegeBarFilter === "all" || college === collegeBarFilter) {
        map[college] = (map[college] || 0) + 1;
      }
    }
    return map;
  }, [papers, facultyMap, collegeBarFilter]);

  const collegeData = useMemo(() => ({
    labels: collegeLabels,
    datasets: [
      {
        label: "",
        data: collegeLabels.map(c => collegeCounts[c] || 0),
        backgroundColor: collegeLabels.map((_, idx) => colorPalette[idx % colorPalette.length]),
        borderWidth: 1.5,
        borderColor: "#fff"
      }
    ]
  }), [collegeLabels, collegeCounts]);

  // Q-Rating Stacked Bar Chart (College Tab)
  const qRatingCounts = useMemo(() => {
    const map = {};
    for (const p of papers) {
      if (qRatingBarFilter === "all" || p.qRating === qRatingBarFilter) {
        if (p.qRating) map[p.qRating] = (map[p.qRating] || 0) + 1;
      }
    }
    return map;
  }, [papers, qRatingBarFilter]);

  const qByCollegeStacked = useMemo(() => ({
    labels: collegeLabels,
    datasets: qKeys.map((q, i) => ({
      label: "",
      data: collegeLabels.map((c) =>
        papers.filter(p => {
          const f = facultyMap.get(p.facultyId);
          const college = f?.college || p.college || "N/A";
          // Filter by q-rating if set
          const matchQ = qRatingBarFilter === "all" ? p.qRating === q : p.qRating === q && p.qRating === qRatingBarFilter;
          return college === c && matchQ;
        }).length
      ),
      backgroundColor: qColors[i],
      borderWidth: 1,
      borderColor: "#fff",
    })),
  }), [collegeLabels, papers, facultyMap, qRatingBarFilter]);

  // FILTERED PAPERS for other tabs
  const filteredPapers = useMemo(() => {
    return papers.filter(p => {
      const f = facultyMap.get(p.facultyId);
      const college = f?.college || p.college || "N/A";
      return collegeFilter === "all" || college === collegeFilter;
    });
  }, [papers, facultyMap, collegeFilter]);

  // Institutes
  const instituteLabels = getAllInstituteNames();
  const instituteCounts = useMemo(() => {
    const map = {};
    for (const p of filteredPapers) {
      const f = facultyMap.get(p.facultyId);
      const inst = f?.institute || p.institute || "N/A";
      map[inst] = (map[inst] || 0) + 1;
    }
    return map;
  }, [filteredPapers, facultyMap]);
  const instituteData = useMemo(() => ({
    labels: instituteLabels,
    datasets: [
      {
        label: "",
        data: instituteLabels.map(inst => instituteCounts[inst] || 0),
        backgroundColor: instituteLabels.map((_, idx) => colorPalette[idx % colorPalette.length]),
        borderWidth: 1.5,
        borderColor: "#fff"
      }
    ]
  }), [instituteLabels, instituteCounts]);

  // Departments
  const departmentLabels = getAllDepartmentNames();
  const departmentCounts = useMemo(() => {
    const map = {};
    for (const p of filteredPapers) {
      const f = facultyMap.get(p.facultyId);
      const dept = f?.department || p.department || "N/A";
      map[dept] = (map[dept] || 0) + 1;
    }
    return map;
  }, [filteredPapers, facultyMap]);
  const departmentData = useMemo(() => ({
    labels: departmentLabels,
    datasets: [
      {
        label: "",
        data: departmentLabels.map(dep => departmentCounts[dep] || 0),
        backgroundColor: departmentLabels.map((_, idx) => colorPalette[idx % colorPalette.length]),
      }
    ]
  }), [departmentLabels, departmentCounts]);

  // Yearly Trends
  const yearlyTrend = useMemo(() => {
    const yearSet = new Set();
    const byCollege = {};
    filteredPapers.forEach(p => {
      const f = facultyMap.get(p.facultyId);
      const college = f?.college || p.college || "N/A";
      const year = Number(p.year) || 0;
      yearSet.add(year);
      if (!byCollege[college]) byCollege[college] = {};
      byCollege[college][year] = (byCollege[college][year] || 0) + 1;
    });
    const years = Array.from(yearSet).filter(Boolean).sort((a, b) => a - b);
    const topColleges = collegeLabels.slice(0, 5);
    return {
      labels: years,
      datasets: topColleges.map((c, idx) => ({
        label: "",
        data: years.map(y => byCollege[c]?.[y] || 0),
        borderColor: colorPalette[idx % colorPalette.length],
        backgroundColor: colorPalette[idx % colorPalette.length] + "33",
        borderWidth: 2,
        tension: 0.25,
        pointRadius: 2,
      })),
    };
  }, [filteredPapers, facultyMap, collegeLabels]);

  // Chart options (no inbuilt label)
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.85)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(59,130,246,0.4)",
        borderWidth: 1,
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(59,130,246,0.08)" }, ticks: { color: "#6B7280" } },
      x: { grid: { display: false }, ticks: { color: "#6B7280" } },
    },
  };
  const stackedBarOptions = {
    ...barOptions,
    scales: {
      ...barOptions.scales,
      x: { ...barOptions.scales.x, stacked: true },
      y: { ...barOptions.scales.y, stacked: true },
    },
  };
  const horizBarOptions = {
    ...barOptions,
    indexAxis: "y",
    scales: {
      x: { ...barOptions.scales.x, beginAtZero: true },
      y: { ...barOptions.scales.y },
    },
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200">
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="college" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 sm:mb-6 bg-gray-50 h-auto">
        <TabsTrigger value="college" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3">
          <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">College</span>
          <span className="sm:hidden">Col</span>
        </TabsTrigger>
        <TabsTrigger value="institute" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3">
          <Building className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Institute</span>
          <span className="sm:hidden">Inst</span>
        </TabsTrigger>
        <TabsTrigger value="department" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3">
          <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Department</span>
          <span className="sm:hidden">Dept</span>
        </TabsTrigger>
        <TabsTrigger value="trends" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3">
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
          Trends
        </TabsTrigger>
      </TabsList>

      {/* College Tab */}
      <TabsContent value="college">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Publications by College */}
          <AnalyticsChart
            type="bar"
            data={collegeData}
            options={barOptions}
            title=""
            icon={Building2}
            badgeText={collegeBarFilter === "all"
              ? Object.values(collegeCounts).reduce((sum, v) => sum + v, 0)
              : collegeCounts[collegeBarFilter] || 0}
          >
            <FilterButtonGroup
              filters={collegeLabels}
              setFilter={setCollegeBarFilter}
              selected={collegeBarFilter}
              type="Colleges"
              showCount={true}
              countMap={collegeCounts}
              colorPalette={colorPalette}
            />
          </AnalyticsChart>

          {/* Q-Rating Breakdown by College */}
          <AnalyticsChart
            type="bar"
            data={qByCollegeStacked}
            options={stackedBarOptions}
            title=""
            icon={Building2}
          >
            <FilterButtonGroup
              filters={qKeys}
              setFilter={setQRatingBarFilter}
              selected={qRatingBarFilter}
              type="Q Ratings"
              showCount={false}
              countMap={qRatingCounts}
              colorPalette={qColors}
            />
          </AnalyticsChart>
        </div>
      </TabsContent>

      {/* Institute */}
      <TabsContent value="institute">
        <AnalyticsChart
          type="bar"
          data={instituteData}
          options={barOptions}
          title=""
          icon={Building}
          badgeText={collegeFilter === "all"
            ? Object.values(instituteCounts).reduce((sum, v) => sum + v, 0)
            : null
          }
        >
          <FilterButtonGroup
            filters={collegeLabels}
            setFilter={setCollegeFilter}
            selected={collegeFilter}
            type="Colleges"
            showCount={true}
            countMap={collegeCounts}
            colorPalette={colorPalette}
          />
        </AnalyticsChart>
      </TabsContent>

      {/* Department */}
      <TabsContent value="department">
        <AnalyticsChart
          type="bar"
          data={departmentData}
          options={horizBarOptions}
          title=""
          icon={Layers}
          badgeText={collegeFilter === "all"
            ? Object.values(departmentCounts).reduce((sum, v) => sum + v, 0)
            : null
          }
        >
          <FilterButtonGroup
            filters={collegeLabels}
            setFilter={setCollegeFilter}
            selected={collegeFilter}
            type="Colleges"
            showCount={true}
            countMap={collegeCounts}
            colorPalette={colorPalette}
          />
        </AnalyticsChart>
      </TabsContent>

      {/* Trends */}
      <TabsContent value="trends">
        <AnalyticsChart
          type="bar"
          data={yearlyTrend}
          options={barOptions}
          title=""
          icon={TrendingUp}
          badgeText={collegeFilter === "all"
            ? filteredPapers.length
            : null
          }
        >
          <FilterButtonGroup
            filters={collegeLabels}
            setFilter={setCollegeFilter}
            selected={collegeFilter}
            type="Colleges"
            showCount={true}
            countMap={collegeCounts}
            colorPalette={colorPalette}
          />
        </AnalyticsChart>
      </TabsContent>
    </Tabs>
  );
}