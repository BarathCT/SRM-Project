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
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  BookOpen,
  Award
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12
        }
      }
    },
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
      grid: {
        color: 'rgba(59, 130, 246, 0.1)'
      },
      ticks: {
        color: '#6B7280'
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#6B7280'
      }
    }
  }
};

const colorPalette = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#EC4899', // Pink
];

export default function CampusAnalyticsCard({ stats, loading }) {
  const chartData = useMemo(() => {
    if (!stats || loading) return null;

    // Q-Rating Distribution
    const qRatingData = {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [{
        data: [
          stats.qDistribution.Q1 || 0,
          stats.qDistribution.Q2 || 0,
          stats.qDistribution.Q3 || 0,
          stats.qDistribution.Q4 || 0,
        ],
        backgroundColor: [
          '#3B82F6', // Q1 - Blue
          '#10B981', // Q2 - Green
          '#F59E0B', // Q3 - Yellow
          '#EF4444', // Q4 - Red
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    // Yearly Trend
    const years = Object.keys(stats.yearlyTrend).sort();
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

    // Subject Area Distribution (top 10)
    const subjectEntries = Object.entries(stats.subjectDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    const subjectAreaData = {
      labels: subjectEntries.map(([subject]) => 
        subject.length > 20 ? subject.substring(0, 20) + '...' : subject
      ),
      datasets: [{
        data: subjectEntries.map(([, count]) => count),
        backgroundColor: colorPalette.slice(0, subjectEntries.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    // Department Stats
    const deptEntries = Object.entries(stats.departmentStats);
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
      departmentData
    };
  }, [stats, loading]);

  if (loading) {
    return (
      <Card className="border border-blue-100 shadow-md bg-white">
        <CardHeader className="bg-blue-50 border-b border-blue-100">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Campus Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-blue-100 rounded"></div>
            <div className="flex space-x-4">
              <div className="h-4 bg-blue-100 rounded flex-1"></div>
              <div className="h-4 bg-blue-100 rounded flex-1"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData) return null;

  return (
    <Card className="border border-white-100 shadow-md bg-white">
      <CardHeader className="bg-white-50 border-b border-blue-100">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Campus Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-50">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Departments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                  Q-Rating Distribution
                </h4>
                <div className="h-64">
                  <Doughnut data={chartData.qRatingData} options={chartOptions} />
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 text-center">
                  Quality Metrics
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-700">Q1 Publications</span>
                    <span className="font-semibold text-blue-700">
                      {stats.qDistribution.Q1 || 0} ({stats.q1Percentage}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-700">Q2 Publications</span>
                    <span className="font-semibold text-green-700">
                      {stats.qDistribution.Q2 || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm text-gray-700">Q3 Publications</span>
                    <span className="font-semibold text-yellow-700">
                      {stats.qDistribution.Q3 || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm text-gray-700">Q4 Publications</span>
                    <span className="font-semibold text-red-700">
                      {stats.qDistribution.Q4 || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                Yearly Publication Trend
              </h4>
              <div className="h-80">
                <Bar data={chartData.yearlyTrendData} options={barChartOptions} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                Top 10 Subject Areas
              </h4>
              <div className="h-80">
                <Pie data={chartData.subjectAreaData} options={chartOptions} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                Department-wise Publication Stats
              </h4>
              <div className="h-80">
                <Bar data={chartData.departmentData} options={barChartOptions} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}