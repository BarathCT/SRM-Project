import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import axios from "axios";
import {
  RefreshCw,
  Building2,
  Users,
  Award,
  Building,
  BookOpen,
  X,
  BarChart3,
} from "lucide-react";

import DashboardHeader from "../components/DashboardHeader";
import PublicationsFilterCard from "../components/PublicationsFilterCard";
import PublicationsTable from "../components/PublicationTable/PublicationsTable";
import StatsCard from "../components/StatsCard";
import CampusAnalyticsCard from "../CampusAdminDashboard/components/CampusAnalyticsCard";
import FacultyDetailsCard from "../CampusAdminDashboard/components/FacultyDetailsCard";
import EditPublicationDialog from "../components/PublicationTable/EditPublicationDialog";
import SuperUserFinder from "./components/SuperUserFinder";
import { SUBJECT_AREAS } from "@/utils/subjectAreas";
import SuperAdminAnalyticsCard from "./components/SuperAdminAnalyticsCard";
import { useToast } from "@/components/Toast";

import {
  getInstitutesForCollege,
  getDepartments,
  ALL_COLLEGE_NAMES,
  collegesWithoutInstitutes,
  getCollegeData,
} from "@/utils/collegeData";

const PUBLICATION_TYPES = ["scopus", "sci", "webOfScience"];
const Q_RATINGS = ["Q1", "Q2", "Q3", "Q4"];

export default function SuperAdminDashboard() {
  const { toast } = useToast();

  // Core state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scope selectors
  const [selectedCollege, setSelectedCollege] = useState("all");
  const [selectedInstitute, setSelectedInstitute] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Papers loaded for current scope (college/institute selection)
  const [scopePapers, setScopePapers] = useState([]);
  const [scopeLoading, setScopeLoading] = useState(false);

  // Publications table UI
  const [expanded, setExpanded] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedPapers, setSelectedPapers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Filters for publications
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedQRating, setSelectedQRating] = useState("all");
  const [selectedPublicationType, setSelectedPublicationType] = useState("all");
  const [selectedSubjectArea, setSelectedSubjectArea] = useState("all");
  const [selectedSubjectCategory, setSelectedSubjectCategory] = useState("all");

  // Export functionality state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFields, setExportFields] = useState({
    title: true,
    authors: true,
    journal: true,
    publisher: true,
    year: true,
    qRating: true,
    claimedBy: true,
    department: true,
    institute: true,
    college: true,
    publicationId: false,
    authorNo: false,
    isStudentScholar: false,
    studentScholars: false,
    typeOfIssue: false,
    doi: false,
    pageNo: false,
    publicationType: false,
    subjectArea: false,
    subjectCategories: false,
    volume: false,
    issue: false,
  });

  // Finder modal/drawer
  const [finderOpen, setFinderOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userCollegeFilter, setUserCollegeFilter] = useState("all");
  const [userInstituteFilter, setUserInstituteFilter] = useState("all");
  const [userDeptFilter, setUserDeptFilter] = useState("all");
  const [userHasPubsOnly, setUserHasPubsOnly] = useState(false);

  // Selected user (faculty or campus_admin) and their publications
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserPapers, setSelectedUserPapers] = useState([]);
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);

  // Analytics modal state
  const [showAnalytics, setShowAnalytics] = useState(false);

  // --- Effects ---

  // Load all users (super admin)
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
          params: { role: "all" },
        });
        setUsers(res.data || []);
        toast.academic("Loaded users for all colleges", { duration: 2200 });
      } catch {
        toast.error("Failed to load users", { duration: 3000 });
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load scope papers whenever scope changes
  useEffect(() => {
    if (!users.length) return;
    const fetchScopePapers = async () => {
      setScopeLoading(true);
      setScopePapers([]);
      setExpanded(null);
      setSelectedPapers(new Set());
      setSelectAll(false);
      try {
        const token = localStorage.getItem("token");
        // Build (college,institute) pairs
        let pairs = [];
        if (selectedCollege === "all") {
          pairs = Array.from(new Set(users.map((u) => `${u.college}||${u.institute}`)))
            .filter(Boolean)
            .map((s) => {
              const [college, institute] = s.split("||");
              return { college, institute };
            });
        } else if (selectedInstitute === "all") {
          pairs = Array.from(
            new Set(
              users
                .filter((u) => u.college === selectedCollege)
                .map((u) => `${u.college}||${u.institute}`)
            )
          )
            .filter(Boolean)
            .map((s) => {
              const [college, institute] = s.split("||");
              return { college, institute };
            });
        } else {
          pairs = [{ college: selectedCollege, institute: selectedInstitute }];
        }
        // Fetch for each pair
        const all = [];
        await Promise.all(
          pairs.map(async ({ college, institute }) => {
            const res = await axios.get("http://localhost:5000/api/papers/institute", {
              headers: { Authorization: `Bearer ${token}` },
              params: { college, institute },
            });
            all.push(...(res.data || []));
          })
        );
        setScopePapers(all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch {
        toast.error("Failed to load publications for scope", { duration: 3000 });
      } finally {
        setScopeLoading(false);
      }
    };
    fetchScopePapers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, selectedCollege, selectedInstitute]);

  // --- CollegeData-based dropdowns ---
  const colleges = useMemo(() => ['all', ...ALL_COLLEGE_NAMES.filter(c => c !== 'N/A')], []);
  const institutes = useMemo(() => {
    if (selectedCollege === 'all') return [];
    const insts = getInstitutesForCollege(selectedCollege).filter(i => i !== 'N/A');
    return insts.length > 0 ? ['all', ...insts] : [];
  }, [selectedCollege]);
  const departments = useMemo(() => {
    if (selectedCollege === 'all') return [];
    if (collegesWithoutInstitutes.includes(selectedCollege)) {
      return getDepartments(selectedCollege, null).filter(d => d !== 'N/A');
    }
    if (selectedInstitute === 'all') return [];
    return getDepartments(selectedCollege, selectedInstitute).filter(d => d !== 'N/A');
  }, [selectedCollege, selectedInstitute]);

  // Filter options for PublicationsFilterCard
  const filterOptions = useMemo(() => {
    const years = [...new Set(scopePapers.map((p) => Number(p.year)).filter(Boolean))].sort((a, b) => b - a);
    const qRatings = [...new Set(scopePapers.map((p) => p.qRating).filter(Boolean))].sort();
    const publicationTypes = [...new Set(scopePapers.map((p) => p.publicationType).filter(Boolean))].sort();
    const subjectAreas = [...new Set(scopePapers.map((p) => p.subjectArea).filter(Boolean))].sort();
    const authors = [...new Set(scopePapers.map((p) => p.claimedBy).filter(Boolean))].sort();
    return {
      years,
      qRatings,
      publicationTypes,
      subjectAreas,
      authors,
      departments
    };
  }, [scopePapers, departments, institutes]);

  // Publications filtering logic
  const hasActiveFilters = useMemo(
    () =>
      searchTerm !== "" ||
      selectedYear !== "all" ||
      selectedQRating !== "all" ||
      selectedPublicationType !== "all" ||
      selectedSubjectArea !== "all" ||
      selectedSubjectCategory !== "all" ||
      selectedCollege !== "all" ||
      selectedInstitute !== "all" ||
      selectedDepartment !== "all",
    [
      searchTerm,
      selectedYear,
      selectedQRating,
      selectedPublicationType,
      selectedSubjectArea,
      selectedSubjectCategory,
      selectedCollege,
      selectedInstitute,
      selectedDepartment
    ]
  );

  const filteredPapers = useMemo(() => {
    let data = scopePapers;
    // Apply college/institute/department filters
    if (selectedCollege !== "all" || selectedInstitute !== "all" || selectedDepartment !== "all") {
      const filteredUsers = users.filter((u) => {
        if (selectedCollege !== "all" && u.college !== selectedCollege) return false;
        if (selectedInstitute !== "all" && u.institute !== selectedInstitute) return false;
        if (selectedDepartment !== "all" && u.department !== selectedDepartment) return false;
        return true;
      });
      const facultyIds = new Set(filteredUsers.map(u => u.facultyId));
      data = data.filter(p => facultyIds.has(p.facultyId));
    }
    // Apply other filters
    const term = searchTerm.trim().toLowerCase();
    return data.filter((paper) => {
      const matchesSearch =
        term === "" ||
        paper.title?.toLowerCase().includes(term) ||
        paper.journal?.toLowerCase().includes(term) ||
        paper.claimedBy?.toLowerCase().includes(term) ||
        (paper.authors || []).some((a) => a.name?.toLowerCase().includes(term));
      const matchesYear = selectedYear === "all" || String(paper.year) === String(selectedYear);
      const matchesQ = selectedQRating === "all" || paper.qRating === selectedQRating;
      const matchesType = selectedPublicationType === "all" || paper.publicationType === selectedPublicationType;
      const matchesArea = selectedSubjectArea === "all" || paper.subjectArea === selectedSubjectArea;
      const matchesCategory = selectedSubjectCategory === "all" || (paper.subjectCategories || []).includes(selectedSubjectCategory);
      return matchesSearch && matchesYear && matchesQ && matchesType && matchesArea && matchesCategory;
    });
  }, [
    scopePapers,
    users,
    searchTerm,
    selectedYear,
    selectedQRating,
    selectedPublicationType,
    selectedSubjectArea,
    selectedSubjectCategory,
    selectedCollege,
    selectedInstitute,
    selectedDepartment
  ]);

  // Stats
  const stats = useMemo(() => {
    const papers = filteredPapers;
     const filteredFaculty = users.filter(u => 
      papers.some(p => p.facultyId === u.facultyId)
    );
    const total = papers.length;
    const qDist = papers.reduce((acc, p) => {
      acc[p.qRating] = (acc[p.qRating] || 0) + 1;
      return acc;
    }, {});
    const yearlyTrend = papers.reduce((acc, p) => {
      acc[p.year] = (acc[p.year] || 0) + 1;
      return acc;
    }, {});
    const subjectDistribution = papers.reduce((acc, p) => {
      acc[p.subjectArea] = (acc[p.subjectArea] || 0) + 1;
      return acc;
    }, {});
    const departmentStats = users.reduce((acc, u) => {
      if (
        (selectedCollege !== "all" && u.college !== selectedCollege) ||
        (selectedInstitute !== "all" && u.institute !== selectedInstitute) ||
        (selectedDepartment !== "all" && u.department !== selectedDepartment)
      ) {
        return acc;
      }
      const userPapers = papers.filter((p) => p.facultyId === u.facultyId);
      const dep = u.department || "—";
      if (!acc[dep]) {
        acc[dep] = { faculty: 0, papers: 0, q1Papers: 0, recentPapers: 0 };
      }
      if (userPapers.length > 0) acc[dep].faculty++;
      acc[dep].papers += userPapers.length;
      acc[dep].q1Papers += userPapers.filter((p) => p.qRating === "Q1").length;
      acc[dep].recentPapers += userPapers.filter((p) => Number(p.year) >= new Date().getFullYear() - 1).length;
      return{
        totalFaculty: filteredFaculty.length,
        avgPapersPerFaculty: filteredFaculty.length ? (total / filteredFaculty.length).toFixed(1) : 0,
      } ;
    }, {});
    return {
      totalPapers: total,
      activeFaculty: new Set(papers.map((p) => p.facultyId)).size,
      totalFaculty: filteredFaculty.length,
      qDistribution: qDist,
      yearlyTrend,
      subjectDistribution,
      departmentStats,
      q1Percentage: total ? (((qDist.Q1 || 0) / total) * 100).toFixed(1) : 0,
      avgPapersPerFaculty: filteredFaculty.length ? (total / users.length).toFixed(1) : 0,
    };
  }, [filteredPapers, users, selectedCollege, selectedInstitute, selectedDepartment]);
  // User selection (SuperUserFinder)
  const onSelectUser = useCallback(async (user) => {
    setSelectedUserId(user ? user.facultyId : null);
    setSelectedUserPapers([]);
    if (!user) return;
    setFinderOpen(false);
    setExpanded(null);
    try {
      setSelectedUserLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/papers/institute", {
        headers: { Authorization: `Bearer ${token}` },
        params: { college: user.college, institute: user.institute },
      });
      const papers = (res.data || []).filter((p) => p.facultyId === user.facultyId);
      setSelectedUserPapers(papers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      toast.academic(`Loaded ${papers.length} publications for ${user.fullName}`, { duration: 2200 });
    } catch {
      toast.error("Failed to load user publications", { duration: 2800 });
    } finally {
      setSelectedUserLoading(false);
    }
  }, [toast]);

  const selectedUser = useMemo(
    () => (selectedUserId ? users.find((u) => u.facultyId === selectedUserId) : null),
    [users, selectedUserId]
  );
  const tablePapers = selectedUser ? selectedUserPapers : filteredPapers;

  // --- EXPORT HANDLER ---
  const handleExport = useCallback(
    (selectedFieldKeys) => {
      if (!selectedFieldKeys || !selectedFieldKeys.length) return;

      const papersToExport = selectedPapers.size
        ? filteredPapers.filter(p => selectedPapers.has(p._id))
        : filteredPapers;

      if (!papersToExport.length) {
        toast.warning("No publications to export");
        return;
      }

      // Map all publication IDs to their user (for department/college/institute)
      const facultyMap = {};
      users.forEach(u => {
        if (u.facultyId) facultyMap[u.facultyId] = u;
      });

      const headerMap = {
        title: "Title",
        authors: "Authors",
        journal: "Journal",
        publisher: "Publisher",
        year: "Year",
        qRating: "Q Rating",
        doi: "DOI",
        publicationType: "Publication Type",
        subjectArea: "Subject Area",
        subjectCategories: "Subject Categories",
        claimedBy: "Claimed By",
        department: "Department",
        institute: "Institute",
        college: "College",
        volume: "Volume",
        issue: "Issue",
        pageNo: "Page Numbers",
        publicationId: "Publication ID",
        authorNo: "Author Number",
        isStudentScholar: "Student Scholar",
        studentScholars: "Scholar Names",
        typeOfIssue: "Type of Issue",
      };
      const headers = selectedFieldKeys.map(key => headerMap[key] || key);

      const rows = papersToExport.map(p => {
        const user = facultyMap[p.facultyId] || {};
        const exportRow = selectedFieldKeys.map(field => {
          switch (field) {
            case "authors":
              return (p.authors || []).map(a => a.name).join("; ");
            case "subjectCategories":
              return (p.subjectCategories || []).join("; ");
            case "studentScholars":
              return (p.studentScholars || []).map(s => (typeof s === "string" ? s : s.name)).join("; ");
            case "department":
              // Preferred: from user, fallback to p.department
              return user.department || p.department || "";
            case "institute":
              return user.institute || p.institute || "";
            case "college":
              return user.college || p.college || "";
            default:
              return p[field] ?? "";
          }
        });
        return exportRow;
      });

      const csv = [headers, ...rows]
        .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `superadmin_publications_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDialogOpen(false);
      toast.academic(`Exported ${papersToExport.length} publications`, { duration: 2200 });
    },
    [selectedPapers, filteredPapers, users, toast]
  );

  // --- RENDER ---
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center space-x-3 bg-white p-8 rounded-xl shadow-lg border border-blue-100">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Loading Super Admin Dashboard</h3>
            <p className="text-gray-600">Preparing global analytics…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <DashboardHeader
          title="Super Admin Dashboard"
          subtitle="Global publications analysis across all colleges and institutes"
          icon={<Building2 className="h-6 w-6" />}
          showTabSwitch={false}
          onShowAnalytics={() => setShowAnalytics(true)}
          facultyFinderOpen={finderOpen}
          onFacultyFinderOpenChange={setFinderOpen}
        />

        {/* Finder Drawer/Panel */}
        {finderOpen && (
          <div>
            <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-full md:w-[500px] bg-white shadow-2xl flex flex-col overflow-y-scroll scrollbar-hide transition-all duration-300">
              <SuperUserFinder
                users={users}
                papersInScope={scopePapers}
                userSearchTerm={userSearchTerm}
                onUserSearchTermChange={setUserSearchTerm}
                userRoleFilter={userRoleFilter}
                onUserRoleFilterChange={setUserRoleFilter}
                userCollegeFilter={userCollegeFilter}
                onUserCollegeFilterChange={setUserCollegeFilter}
                userInstituteFilter={userInstituteFilter}
                onUserInstituteFilterChange={setUserInstituteFilter}
                userDeptFilter={userDeptFilter}
                onUserDeptFilterChange={setUserDeptFilter}
                userHasPubsOnly={userHasPubsOnly}
                onUserHasPubsOnlyChange={setUserHasPubsOnly}
                colleges={colleges}
                institutes={institutes.filter(i => i !== "all")}
                departments={departments.filter(d => d !== "all")}
                onSelectUser={onSelectUser}
                selectedUserId={selectedUserId}
                onClose={() => setFinderOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Analytics Modal */}
        {showAnalytics && (
          <section className="max-w-7xl mx-auto mb-8">
            <div className="relative border border-blue-100 rounded-2xl shadow-lg bg-gradient-to-tr from-white to-blue-50/70 overflow-hidden">
              <header className="flex items-center justify-between px-8 py-5 border-b border-blue-100 bg-white/80 rounded-t-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-7 w-7 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Analytics Overview
                  </h2>
                </div>
                <button
                  className="p-2 rounded-full hover:bg-blue-100 transition"
                  onClick={() => setShowAnalytics(false)}
                  aria-label="Close analytics"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </header>
              <main className="p-8 bg-gradient-to-tr from-white/70 to-blue-50 rounded-b-2xl">
                <div className="grid grid-cols-1 gap-y-8">
                  <CampusAnalyticsCard stats={stats} loading={scopeLoading} />
                  <SuperAdminAnalyticsCard
                    papers={filteredPapers}
                    users={users}
                    selectedCollege={selectedCollege}
                    selectedInstitute={selectedInstitute}
                    loading={scopeLoading}
                  />
                </div>
              </main>
            </div>
          </section>
        )}

        {/* Summary cards */}
        {!selectedUser && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Publications"
              value={stats.totalPapers}
              subtitle={`Avg ${stats.avgPapersPerFaculty} per faculty`}
              icon={<Building className="h-8 w-8 text-blue-600" />}
              loading={scopeLoading}
            />
            <StatsCard
              title="Total Faculty"
              value={`${stats.totalFaculty}`}
              subtitle=" "
              icon={<Users className="h-8 w-8 text-blue-600" />}
              loading={scopeLoading}
            />
            <StatsCard
              title="Q1 Publications"
              value={(stats.qDistribution || {}).Q1 || 0}
              subtitle={`${stats.q1Percentage}% of total`}
              icon={<Award className="h-8 w-8 text-blue-600" />}
              loading={scopeLoading}
            />
          </div>
        )}

        {/* Selected user details */}
        {selectedUser && (
          <div className="mb-6">
            <FacultyDetailsCard
              faculty={selectedUser}
              papers={selectedUserPapers}
              onClear={() => {
                setSelectedUserId(null);
                setSelectedUserPapers([]);
              }}
            />
          </div>
        )}

        {/* Publications filter (hidden when viewing a user) */}
        {!selectedUser && (
          <PublicationsFilterCard
            filterOptions={filterOptions}
            searchTerm={searchTerm}
            selectedYear={selectedYear}
            selectedQRating={selectedQRating}
            selectedPublicationType={selectedPublicationType}
            selectedSubjectArea={selectedSubjectArea}
            selectedSubjectCategory={selectedSubjectCategory}
            selectedCollege={selectedCollege}
            selectedInstitute={selectedInstitute}
            selectedDepartment={selectedDepartment}
            onSearchTermChange={setSearchTerm}
            onYearChange={setSelectedYear}
            onQRatingChange={setSelectedQRating}
            onPublicationTypeChange={setSelectedPublicationType}
            onSubjectAreaChange={setSelectedSubjectArea}
            onSubjectCategoryChange={setSelectedSubjectCategory}
            onCollegeChange={setSelectedCollege}
            onInstituteChange={setSelectedInstitute}
            onDepartmentChange={setSelectedDepartment}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={() => {
              setSearchTerm("");
              setSelectedYear("all");
              setSelectedQRating("all");
              setSelectedPublicationType("all");
              setSelectedSubjectArea("all");
              setSelectedSubjectCategory("all");
              setSelectedCollege("all");
              setSelectedInstitute("all");
              setSelectedDepartment("all");
              toast.info("Cleared filters", { duration: 1500 });
            }}
            selectedCount={selectedPapers.size}
            onClearSelection={() => {
              setSelectedPapers(new Set());
              setSelectAll(false);
              toast.info("Cleared selection", { duration: 1500 });
            }}
            exportDialogOpen={exportDialogOpen}
            onExportDialogOpenChange={setExportDialogOpen}
            exportFields={exportFields}
            onExportFieldsChange={setExportFields}
            isSuperAdmin={true}
            userRole="super_admin"
            showCampusFilters={true}
            onExport={handleExport}
          />
        )}

        {/* Publications table */}
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-gray-700 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            {selectedUser ? (
              <>
                Showing <span className="font-semibold text-gray-900">{selectedUserPapers.length}</span> of{" "}
                <span className="font-semibold text-gray-900">{selectedUserPapers.length}</span> publications for{" "}
                <span className="font-medium text-blue-700">{selectedUser?.fullName}</span>
              </>
            ) : (
              <>
                Showing <span className="font-semibold text-gray-900">{filteredPapers.length}</span> of{" "}
                <span className="font-semibold text-gray-900">{scopePapers.length}</span> publications in scope
              </>
            )}
            {selectedPapers.size > 0 && (
              <span className="text-blue-600">
                {" "}
                • <span className="font-semibold">{selectedPapers.size}</span> selected
              </span>
            )}
          </p>
          {selectedUser && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{selectedUser?.college}</span>
              {" • "}
              <span className="font-medium">{selectedUser?.institute}</span>
            </div>
          )}
        </div>

        <PublicationsTable
          papers={tablePapers}
          selectedPapers={selectedPapers}
          selectAll={selectAll}
          onToggleSelectAll={() => {
            if (selectAll) {
              setSelectedPapers(new Set());
              setSelectAll(false);
              toast.info("Deselected all", { duration: 1500 });
            } else {
              const ids = new Set(filteredPapers.map((p) => p._id));
              setSelectedPapers(ids);
              setSelectAll(true);
              toast.success(`Selected ${ids.size} visible`, { duration: 1500 });
            }
          }}
          onToggleSelect={(id) => {
            const next = new Set(selectedPapers);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            setSelectedPapers(next);
            setSelectAll(next.size === filteredPapers.length);
          }}
          expandedIndex={expanded}
          onToggleExpand={(i) => setExpanded(expanded === i ? null : i)}
          onEdit={(paper) => {
            setEditingId(paper._id);
            setEditData({
              title: paper.title || "",
              journal: paper.journal || "",
              publisher: paper.publisher || "",
              year: paper.year || new Date().getFullYear(),
              qRating: paper.qRating || "Q1",
              doi: paper.doi || "",
              volume: paper.volume || "",
              issue: paper.issue || "",
              pageNo: paper.pageNo || "",
              publicationType: paper.publicationType || "scopus",
              subjectArea: paper.subjectArea || "Computer Science",
              subjectCategories: paper.subjectCategories?.length ? paper.subjectCategories : ["Artificial Intelligence"],
              publicationId: paper.publicationId || "",
              typeOfIssue: paper.typeOfIssue || "Regular Issue",
              claimedBy: paper.claimedBy || "",
              authorNo: paper.authorNo || "1",
              isStudentScholar: paper.isStudentScholar || "no",
              authors: paper.authors?.length
                ? paper.authors.map((a) => ({ name: a.name || "", isCorresponding: !!a.isCorresponding }))
                : [{ name: paper.claimedBy || "", isCorresponding: true }],
              studentScholars: paper.studentScholars?.length
                ? paper.studentScholars.map((s) => (typeof s === "string" ? { name: s, id: "" } : { name: s.name || "", id: s.id || "" }))
                : [],
            });
            setEditDialogOpen(true);
          }}
          onDelete={async (id) => {
            setDeletingId(id);
            try {
              const token = localStorage.getItem("token");
              await axios.delete(`http://localhost:5000/api/papers/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setScopePapers((prev) => prev.filter((p) => p._id !== id));
              setSelectedPapers((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
              toast.success("Publication deleted", { duration: 2000 });
            } catch {
              toast.error("Delete failed", { duration: 2500 });
            } finally {
              setDeletingId(null);
            }
          }}
          deletingId={deletingId}
          hasActiveFilters={!selectedUser && hasActiveFilters}
          onClearFilters={() => {
            setSearchTerm("");
            setSelectedYear("all");
            setSelectedQRating("all");
            setSelectedPublicationType("all");
            setSelectedSubjectArea("all");
            setSelectedSubjectCategory("all");
            setSelectedCollege("all");
            setSelectedInstitute("all");
            setSelectedDepartment("all");
            toast.info("Cleared filters", { duration: 1500 });
          }}
          showAuthorInfo={true}
          users={users}
          currentUser={{ role: "super_admin" }}
          canEditPaper={() => true}
          canDeletePaper={() => true}
        />
      </div>
      <EditPublicationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        value={editData}
        onChange={setEditData}
        onSubmit={async () => {
          // ...your update logic goes here
        }}
        onCancel={() => setEditDialogOpen(false)}
        isSubmitting={false}
        subjectAreas={SUBJECT_AREAS}
        publicationTypes={PUBLICATION_TYPES}
        qRatings={Q_RATINGS}
      />
    </div>
  );
}