import React, { useMemo } from "react";
import { X } from "lucide-react";
import { 
  GraduationCap, 
  Award, 
  TrendingUp, 
  BookOpen, 
  Mail, 
  Users, 
  Building2, 
  Building, 
  UserCheck, 
  Shield,
  Calendar,
  Hash,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FacultyDetailsCard = ({ faculty, papers, onClear }) => {
  const stats = useMemo(() => {
    const total = papers.length;
    const q1 = papers.filter((p) => p.qRating === "Q1").length;
    const q2 = papers.filter((p) => p.qRating === "Q2").length;
    const q3 = papers.filter((p) => p.qRating === "Q3").length;
    const q4 = papers.filter((p) => p.qRating === "Q4").length;
    
    const thisYear = new Date().getFullYear();
    const recent = papers.filter((p) => Number(p.year) >= thisYear - 1).length;
    const lastTwoYears = papers.filter((p) => Number(p.year) >= thisYear - 2).length;

    const years = Array.from(new Set(papers.map((p) => p.year))).sort();
    const firstYear = years[0] || "—";
    const lastYear = years[years.length - 1] || "—";

    // Subject area distribution
    const subjectAreas = papers.reduce((acc, p) => {
      acc[p.subjectArea] = (acc[p.subjectArea] || 0) + 1;
      return acc;
    }, {});

    // Publication type distribution
    const pubTypes = papers.reduce((acc, p) => {
      acc[p.publicationType] = (acc[p.publicationType] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      q1,
      q2,
      q3,
      q4,
      q1Pct: total ? ((q1 / total) * 100).toFixed(1) : "0.0",
      recent,
      lastTwoYears,
      firstYear,
      lastYear,
      subjectAreas,
      pubTypes,
      yearSpan: firstYear !== "—" && lastYear !== "—" ? lastYear - firstYear + 1 : 0
    };
  }, [papers]);

  // Get author ID information
  const getAuthorIdInfo = (user) => {
    const authorIds = user?.authorId || {};
    return {
      scopus: authorIds.scopus,
      sci: authorIds.sci,
      webOfScience: authorIds.webOfScience,
      hasAny: !!(authorIds.scopus || authorIds.sci || authorIds.webOfScience),
      count: [authorIds.scopus, authorIds.sci, authorIds.webOfScience].filter(Boolean).length
    };
  };

  // Get role badge
  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return { 
          className: 'bg-red-600 text-white', 
          icon: <Shield className="h-3 w-3" />, 
          label: 'Super Admin' 
        };
      case 'campus_admin':
        return { 
          className: 'bg-blue-600 text-white', 
          icon: <Building2 className="h-3 w-3" />, 
          label: 'Campus Admin' 
        };
      case 'faculty':
        return { 
          className: 'bg-green-600 text-white', 
          icon: <UserCheck className="h-3 w-3" />, 
          label: 'Faculty' 
        };
      default:
        return { 
          className: 'bg-gray-600 text-white', 
          icon: <Users className="h-3 w-3" />, 
          label: 'User' 
        };
    }
  };

  if (!faculty) return null;

  const authorIdInfo = getAuthorIdInfo(faculty);
  const roleBadge = getRoleBadge(faculty.role);

  return (
    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <CardHeader className="bg-gradient-to-r from-white-50 to-white-50 border-b border-grey-200">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            {/* Header with name and role */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {faculty.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-1">
                  {faculty.fullName}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={roleBadge.className}>
                    {roleBadge.icon}
                    <span className="ml-1">{roleBadge.label}</span>
                  </Badge>
                  {faculty.role === 'faculty' && (
                    <Badge 
                      variant="outline" 
                      className={
                        authorIdInfo.hasAny 
                          ? "border-green-300 bg-green-50 text-green-700" 
                          : "border-orange-300 bg-orange-50 text-orange-700"
                      }
                    >
                      <Award className="h-3 w-3 mr-1" />
                      {authorIdInfo.hasAny ? `${authorIdInfo.count} Author ID${authorIdInfo.count > 1 ? 's' : ''}` : 'No Author IDs'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4 text-blue-500" />
                <span className="font-mono">{faculty.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Hash className="h-4 w-4 text-purple-500" />
                <span className="font-mono">ID: {faculty.facultyId}</span>
              </div>
            </div>

            {/* Institutional Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Building2 className="h-4 w-4 text-blue-500" />
                <div>
                  <span className="text-gray-500">College:</span>
                  <span className="ml-1 font-medium text-gray-800">{faculty.college || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Building className="h-4 w-4 text-green-500" />
                <div>
                  <span className="text-gray-500">Institute:</span>
                  <span className="ml-1 font-medium text-gray-800">{faculty.institute || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4 text-purple-500" />
                <div>
                  <span className="text-gray-500">Department:</span>
                  <span className="ml-1 font-medium text-gray-800">{faculty.department || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

{onClear && (
  <button
    onClick={onClear}
    aria-label="Close"
    className="
      rounded-full p-2
      text-gray-500
      hover:text-gray-700
      hover:bg-gray-100
      transition
    "
  >
    <X className="h-6 w-6 text-gray-500" />
  </button>
)}

        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Author IDs Section for Faculty */}
        {(faculty.role === 'faculty' || faculty.role === 'campus_admin')  && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600" />
              Research Author IDs
            </h4>
            
            {authorIdInfo.hasAny ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
<div className="flex items-center gap-2 p-3 rounded-lg border border-blue-100 bg-blue-50">
  <CheckCircle className="h-4 w-4 text-blue-600" />
  <div>
    <span className="text-xs text-blue-600 font-medium">Scopus ID</span>

    <div className="text-sm">
      {authorIdInfo.scopus ? (
        <a
          href={`https://www.scopus.com/authid/detail.uri?authorId=${authorIdInfo.scopus}`}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex items-center gap-1
            font-mono
            text-blue-700
            underline underline-offset-2
            hover:text-blue-500
            transition-colors
          "
        >
          {authorIdInfo.scopus}
          <span className="text-xs">↗</span>
        </a>
      ) : (
        <span className="text-gray-400">Not set</span>
      )}
    </div>
  </div>
</div>

                
<div className="flex items-center gap-2 p-3 rounded-lg border border-green-100 bg-green-50">
  <CheckCircle className="h-4 w-4 text-green-600" />
  <div>
    <span className="text-xs text-green-600 font-medium">SCI ID</span>

    <div className="text-sm">
      {authorIdInfo.sci ? (
        <a
          href={`https://www.webofscience.com/wos/author/record/${authorIdInfo.sci}`}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex items-center gap-1
            font-mono
            text-green-700
            underline underline-offset-2
            hover:text-green-500
            transition-colors
          "
        >
          {authorIdInfo.sci}
          <span className="text-xs">↗</span>
        </a>
      ) : (
        <span className="text-gray-400">Not set</span>
      )}
    </div>
  </div>
</div>

                
<div className="flex items-center gap-2 p-3 rounded-lg border border-purple-100 bg-purple-50">
  <CheckCircle className="h-4 w-4 text-purple-600" />
  <div>
    <span className="text-xs text-purple-600 font-medium">Web of Science</span>

    <div className="text-sm">
      {authorIdInfo.webOfScience ? (
        <a
          href={`https://www.webofscience.com/wos/author/record/${authorIdInfo.webOfScience}`}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex items-center gap-1
            font-mono
            text-purple-700
            underline underline-offset-2
            hover:text-purple-500
            transition-colors
          "
        >
          {authorIdInfo.webOfScience}
          <span className="text-xs">↗</span>
        </a>
      ) : (
        <span className="text-gray-400">Not set</span>
      )}
    </div>
  </div>
</div>

              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg border border-orange-200 bg-orange-50">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <span className="text-sm font-medium text-orange-800">No Author IDs Available</span>
                  <p className="text-xs text-orange-700">Faculty needs at least one Author ID to upload research papers</p>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Publication Statistics */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            Publication Statistics
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<BookOpen className="h-5 w-5 text-blue-600" />}
              label="Total Papers"
              value={stats.total}
              subtitle={stats.yearSpan > 0 ? `Over ${stats.yearSpan} years` : ""}
            />
            <StatCard
              icon={<Award className="h-5 w-5 text-yellow-600" />}
              label="Q1 Papers"
              value={`${stats.q1} (${stats.q1Pct}%)`}
              subtitle="High impact"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-green-600" />}
              label="Recent"
              value={stats.recent}
              subtitle="Last 12 months"
            />
            <StatCard
              icon={<Calendar className="h-5 w-5 text-purple-600" />}
              label="Active Period"
              value={stats.firstYear === "—" ? "—" : `${stats.firstYear} - ${stats.lastYear}`}
              subtitle={stats.yearSpan > 0 ? `${stats.yearSpan} years` : ""}
            />
          </div>
        </div>

        {/* Q-Rating Distribution */}
        {stats.total > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Quality Distribution</h4>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-lg font-bold text-blue-700">{stats.q1}</div>
                <div className="text-xs text-blue-600">Q1</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-green-50 border border-green-200">
                <div className="text-lg font-bold text-green-700">{stats.q2}</div>
                <div className="text-xs text-green-600">Q2</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="text-lg font-bold text-yellow-700">{stats.q3}</div>
                <div className="text-xs text-yellow-600">Q3</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-lg font-bold text-gray-700">{stats.q4}</div>
                <div className="text-xs text-gray-600">Q4</div>
              </div>
            </div>
          </div>
        )}

        {/* Research Areas */}
        {Object.keys(stats.subjectAreas).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Research Areas</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.subjectAreas)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([area, count]) => (
                <Badge key={area} variant="outline" className="text-xs">
                  {area} ({count})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StatCard = ({ icon, label, value, subtitle }) => (
  <div className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
    <div className="flex items-center gap-2 text-gray-700 mb-1">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <div className="text-base font-bold text-gray-900">{value}</div>
    {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
  </div>
);

export default FacultyDetailsCard;