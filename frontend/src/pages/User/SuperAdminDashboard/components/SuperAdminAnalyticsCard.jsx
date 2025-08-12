import React, { useMemo } from "react";
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
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
import {
  BarChart3,
  Building,
  Building2,
  Award,
  Layers,
  TrendingUp,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        usePointStyle: true,
        padding: 18,
        font: { size: 12 },
      },
    },
    tooltip: {
      backgroundColor: "rgba(0,0,0,0.85)",
      titleColor: "#fff",
      bodyColor: "#fff",
      borderColor: "rgba(59,130,246,0.4)",
      borderWidth: 1,
    },
  },
};

const barOptions = {
  ...baseOptions,
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: "rgba(59,130,246,0.08)" },
      ticks: { color: "#6B7280" },
    },
    x: {
      grid: { display: false },
      ticks: { color: "#6B7280" },
    },
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

const colorPalette = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#06B6D4", // cyan
  "#F97316", // orange
  "#EC4899", // pink
  "#22C55E", // emerald
  "#0EA5E9", // sky
  "#A855F7", // purple
  "#84CC16", // lime
  "#EAB308", // yellow
];

export default function SuperAdminAnalyticsCard({
  papers = [],
  users = [],
  selectedCollege = "all",
  selectedInstitute = "all",
  loading = false,
}) {
  // Build a quick lookup for faculty metadata
  const facultyMap = useMemo(() => {
    const m = new Map();
    for (const u of users) {
      if (u?.facultyId) m.set(u.facultyId, u);
    }
    return m;
  }, [users]);

  const comparisons = useMemo(() => {
    const collegeTotals = {};
    const collegeQ = {}; // { college: { Q1, Q2, Q3, Q4 } }
    const instituteTotals = {}; // key: `${college}||${institute}`
    const deptTotals = {}; // department across current selection
    const yearlyByCollege = {}; // { college: { [year]: count } }

    for (const p of papers) {
      const f = facultyMap.get(p.facultyId);
      const college = f?.college || "N/A";
      const institute = f?.institute || "N/A";
      const dept = f?.department || "N/A";
      const year = Number(p.year) || 0;

      // College totals
      collegeTotals[college] = (collegeTotals[college] || 0) + 1;

      // College Q distribution
      if (!collegeQ[college]) {
        collegeQ[college] = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      }
      if (p.qRating && collegeQ[college][p.qRating] !== undefined) {
        collegeQ[college][p.qRating] += 1;
      }

      // Institute totals
      const instKey = `${college}||${institute}`;
      instituteTotals[instKey] = (instituteTotals[instKey] || 0) + 1;

      // Department totals
      deptTotals[dept] = (deptTotals[dept] || 0) + 1;

      // Yearly by college
      if (!yearlyByCollege[college]) yearlyByCollege[college] = {};
      yearlyByCollege[college][year] = (yearlyByCollege[college][year] || 0) + 1;
    }

    // Derive sorted labels
    const collegeLabels = Object.keys(collegeTotals).sort(
      (a, b) => collegeTotals[b] - collegeTotals[a]
    );

    // Institutes filtered by current selectedCollege (or top 10 overall)
    const instituteEntries = Object.entries(instituteTotals).map(([key, count]) => {
      const [c, i] = key.split("||");
      return { college: c, institute: i, count };
    });

    let instituteData;
    if (selectedCollege !== "all") {
      const ofCollege = instituteEntries
        .filter((x) => x.college === selectedCollege)
        .sort((a, b) => b.count - a.count);
      instituteData = {
        labels: ofCollege.map((x) => x.institute),
        counts: ofCollege.map((x) => x.count),
      };
    } else {
      const top10 = instituteEntries
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      instituteData = {
        labels: top10.map((x) =>
          x.college === "N/A" ? x.institute : `${x.college}: ${x.institute}`
        ),
        counts: top10.map((x) => x.count),
      };
    }

    // Department Top 15 (current scope)
    const deptTop = Object.entries(deptTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    // Multi-series yearly (top 5 colleges)
    const top5Colleges = collegeLabels.slice(0, 5);
    const allYears = Array.from(
      new Set(
        top5Colleges.flatMap((c) => Object.keys(yearlyByCollege[c] || {}))
      )
    )
      .map(Number)
      .filter(Boolean)
      .sort((a, b) => a - b);

    return {
      collegeTotals,
      collegeLabels,
      collegeQ,
      instituteData,
      deptTop,
      yearlyByCollege,
      top5Colleges,
      allYears,
    };
  }, [papers, facultyMap, selectedCollege]);

  if (loading) {
    return (
      <Card className="border border-blue-100 shadow-md bg-white">
        <CardHeader className="bg-blue-50 border-b border-blue-100">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Comparative Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-blue-100 rounded" />
            <div className="h-64 bg-blue-100 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { collegeLabels, collegeTotals, collegeQ, instituteData, deptTop, top5Colleges, allYears } =
    comparisons;

  // Datasets
  const collegeTotalsBar = {
    labels: collegeLabels,
    datasets: [
      {
        label: "Publications",
        data: collegeLabels.map((c) => collegeTotals[c] || 0),
        backgroundColor: collegeLabels.map(
          (_, idx) => colorPalette[idx % colorPalette.length]
        ),
        borderWidth: 1.5,
        borderColor: "#ffffff",
      },
    ],
  };

  const qKeys = ["Q1", "Q2", "Q3", "Q4"];
  const qColors = ["#3B82F6", "#10B981", "#F59E0B", "#6B7280"];
  const qByCollegeStacked = {
    labels: collegeLabels,
    datasets: qKeys.map((q, i) => ({
      label: q,
      data: collegeLabels.map((c) => (collegeQ[c]?.[q] || 0)),
      backgroundColor: qColors[i],
      borderWidth: 1,
      borderColor: "#fff",
    })),
  };

  const institutesBar = {
    labels: instituteData.labels,
    datasets: [
      {
        label: "Publications",
        data: instituteData.counts,
        backgroundColor: instituteData.labels.map(
          (_, idx) => colorPalette[idx % colorPalette.length]
        ),
        borderWidth: 1.5,
        borderColor: "#fff",
      },
    ],
  };

  const deptBar = {
    labels: deptTop.map(([d]) => d),
    datasets: [
      {
        label: "Publications",
        data: deptTop.map(([, c]) => c),
        backgroundColor: "#3B82F6",
      },
    ],
  };

  const multiLineYearly = {
    labels: allYears,
    datasets: top5Colleges.map((c, idx) => ({
      label: c,
      data: allYears.map((y) => comparisons.yearlyByCollege[c]?.[y] || 0),
      borderColor: colorPalette[idx % colorPalette.length],
      backgroundColor: colorPalette[idx % colorPalette.length] + "33",
      borderWidth: 2,
      tension: 0.25,
      pointRadius: 2,
    })),
  };

  return (
    <Card className="border border-blue-100 shadow-md bg-white">
      <CardHeader className="bg-blue-50 border-b border-blue-100">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Comparative Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="colleges" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-50">
            <TabsTrigger value="colleges" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Colleges
            </TabsTrigger>
            <TabsTrigger value="institutes" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Institutes
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger>
          </TabsList>

          {/* Colleges */}
          <TabsContent value="colleges" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="h-80">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                  Publications by College
                </h4>
                <Bar data={collegeTotalsBar} options={barOptions} />
              </div>
              <div className="h-80">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                  Q-Rating Breakdown by College (Stacked)
                </h4>
                <Bar data={qByCollegeStacked} options={stackedBarOptions} />
              </div>
            </div>
          </TabsContent>

          {/* Institutes */}
          <TabsContent value="institutes" className="space-y-6">
            <div className="h-96">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                {selectedCollege !== "all"
                  ? `Institutes in ${selectedCollege}`
                  : "Top Institutes (All Colleges)"}
              </h4>
              <Bar data={institutesBar} options={barOptions} />
            </div>
          </TabsContent>

          {/* Departments */}
          <TabsContent value="departments" className="space-y-6">
            <div className="h-96">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                {selectedInstitute !== "all" && selectedCollege !== "all"
                  ? `Departments in ${selectedInstitute}, ${selectedCollege}`
                  : selectedCollege !== "all"
                  ? `Departments in ${selectedCollege}`
                  : "Top Departments (Current Selection)"}
              </h4>
              {/* Horizontal bar by flipping axes with indexAxis */}
              <Bar
                data={deptBar}
                options={{
                  ...barOptions,
                  indexAxis: "y",
                  scales: {
                    x: { ...barOptions.scales.x, beginAtZero: true },
                    y: { ...barOptions.scales.y },
                  },
                }}
              />
            </div>
          </TabsContent>

          {/* Trends */}
          <TabsContent value="trends" className="space-y-6">
            <div className="h-96">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                Yearly Trend by College (Top 5)
              </h4>
              <Line data={multiLineYearly} options={baseOptions} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}