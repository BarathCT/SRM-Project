import React, { useMemo } from "react";
import { GraduationCap, Award, TrendingUp, BookOpen } from "lucide-react";

const FacultyDetailsCard = ({ faculty, papers, onClear }) => {
  const stats = useMemo(() => {
    const total = papers.length;
    const q1 = papers.filter((p) => p.qRating === "Q1").length;
    const thisYear = new Date().getFullYear();
    const recent = papers.filter((p) => Number(p.year) >= thisYear - 1).length;

    const years = Array.from(new Set(papers.map((p) => p.year))).sort();
    const firstYear = years[0] || "—";
    const lastYear = years[years.length - 1] || "—";

    return {
      total,
      q1,
      q1Pct: total ? ((q1 / total) * 100).toFixed(1) : "0.0",
      recent,
      firstYear,
      lastYear,
    };
  }, [papers]);

  if (!faculty) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{faculty.fullName}</h3>
          <p className="text-sm text-gray-600">
            {faculty.department || "—"} {faculty.designation ? `• ${faculty.designation}` : ""}
          </p>
          {faculty.email && (
            <p className="text-xs text-gray-500 mt-1">{faculty.email}</p>
          )}
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="text-sm text-blue-700 hover:underline"
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <Stat
          icon={<BookOpen className="h-5 w-5 text-blue-600" />}
          label="Publications"
          value={stats.total}
        />
        <Stat
          icon={<Award className="h-5 w-5 text-blue-600" />}
          label="Q1 Papers"
          value={`${stats.q1} (${stats.q1Pct}%)`}
        />
        <Stat
          icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          label="Recent (≤1y)"
          value={stats.recent}
        />
        <Stat
          icon={<GraduationCap className="h-5 w-5 text-blue-600" />}
          label="Active Years"
          value={
            stats.firstYear === "—" ? "—" : `${stats.firstYear} - ${stats.lastYear}`
          }
        />
      </div>
    </div>
  );
};

const Stat = ({ icon, label, value }) => (
  <div className="border border-gray-200 rounded-lg p-3 bg-white">
    <div className="flex items-center gap-2 text-gray-700">
      {icon}
      <span className="text-xs">{label}</span>
    </div>
    <div className="mt-1 text-base font-semibold text-gray-900">{value}</div>
  </div>
);

export default FacultyDetailsCard;