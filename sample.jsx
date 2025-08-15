import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { useToast } from "@/components/Toast";
import {
  RefreshCw,
  Building2,
  Users,
  Award,
  Building,
  BookOpen,
  Search,
  Shield,
  UserCheck,
} from "lucide-react";

import DashboardHeader from "../components/dashboardHeader";
import PublicationsFilterCard from "../components/PublicationsFilterCard";
import PublicationsTable from "../components/PublicationTable/PublicationsTable";
import StatsCard from "../components/StatsCard";
import CampusAnalyticsCard from "../CampusAdminDashboard/components/CampusAnalyticsCard";
import FacultyDetailsCard from "../CampusAdminDashboard/components/FacultyDetailsCard";
import EditPublicationDialog from "../components/PublicationTable/EditPublicationDialog";
import SuperUserFinder from "./components/SuperUserFinder";
import { SUBJECT_AREAS } from "@/utils/subjectAreas";
import SuperAdminAnalyticsCard from "./components/SuperAdminAnalyticsCard";

// Super admin should stick to backend enum to avoid validation errors
const PUBLICATION_TYPES = ["scopus", "sci", "webOfScience"];
const Q_RATINGS = ["Q1", "Q2", "Q3", "Q4"];

/**
 * SuperAdminDashboard
 * - No "My Publications" tab
 * - Global analytics across all colleges/institutes/departments
 * - Scope selector: College → Institute (if applicable) → Department (if desired in analysis filters)
 * - Powerful user finder across all (faculty and campus admins) to view person-level publications
 */
export default function SuperAdminDashboard() {
  const { toast } = useToast();

  // Users and scope
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

  // Export functionality state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFields, setExportFields] = useState({
    // Essential fields for super admin
    title: true,
    authors: true,
    journal: true,
    publisher: true,
    year: true,
    qRating: true,
    claimedBy: true,
    department: true,
    campus: true,
    
    // Administrative fields
    publicationId: false,
    authorNo: false,
    isStudentScholar: false,
    studentScholars: false,
    typeOfIssue: false,
    
    // Technical fields
    doi: false,
    pageNo: false,
    publicationType: false,
    subjectArea: false,
    subjectCategories: false,
    
    // Additional metadata
    volume: false,
    issue: false,
  });

  // User finder
  const [finderOpen, setFinderOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all"); // "all" | "faculty" | "campus_admin"
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

  // Init: load all users (super admin)
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
          params: { role: "all" },
        });
        setUsers(res.data || []);
        toast.academic("Loaded users for all colleges", { duration: 2200 });
      } catch (e) {
        toast.error("Failed to load users", { duration: 3000 });
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived options from users for scope selectors
  const colleges = useMemo(() => {
    return ["all", ...Array.from(new Set(users.map((u) => u.college).filter(Boolean))).sort()];
  }, [users]);

  const institutes = useMemo(() => {
    if (selectedCollege === "all") return ["all"];
    const list = users
      .filter((u) => u.college === selectedCollege)
      .map((u) => u.institute || "N/A");
    return ["all", ...Array.from(new Set(list)).sort()];
  }, [users, selectedCollege]);

  const departments = useMemo(() => {
    const scopeUsers = users.filter((u) => {
      if (selectedCollege !== "all" && u.college !== selectedCollege) return false;
      if (selectedInstitute !== "all" && u.institute !== selectedInstitute) return false;
      return true;
    });
    return ["all", ...Array.from(new Set(scopeUsers.map((u) => u.department).filter(Boolean))).sort()];
  }, [users, selectedCollege, selectedInstitute]);

  // Load scope papers whenever college/institute selection changes
  useEffect(() => {
    const fetchScopePapers = async () => {
      try {
        setScopeLoading(true);
        setScopePapers([]);
        setExpanded(null);
        setSelectedPapers(new Set());
        setSelectAll(false);

        const token = localStorage.getItem("token");

        // Build institute list to fetch, based on users data
        let pairs = [];
        if (selectedCollege === "all") {
          pairs = Array.from(
            new Set(users.map((u) => `${u.college}||${u.institute}`))
          )
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

        // Fetch papers for each (college,institute) pair (super_admin is authorized)
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
      } catch (e) {
        console.error("Scope papers fetch error", e);
        toast.error("Failed to load publications for scope", { duration: 3000 });
      } finally {
        setScopeLoading(false);
      }
    };

    if (users.length) fetchScopePapers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, selectedCollege, selectedInstitute]);

  // Filter options from scopePapers for PublicationsFilterCard
  const filterOptions = useMemo(() => {
    const years = [...new Set(scopePapers.map((p) => Number(p.year)).filter(Boolean))].sort((a, b) => b - a);
    const qRatings = [...new Set(scopePapers.map((p) => p.qRating).filter(Boolean))].sort();
    const publicationTypes = [...new Set(scopePapers.map((p) => p.publicationType).filter(Boolean))].sort();
    const subjectAreas = [...new Set(scopePapers.map((p) => p.subjectArea).filter(Boolean))].sort();
    
    // Super admin specific filter options
    const authors = [...new Set(scopePapers.map((p) => p.claimedBy).filter(Boolean))].sort();
    const departments = [...new Set(scopePapers.map((p) => {
      const user = users.find(u => u.facultyId === p.facultyId);
      return user?.department;
    }).filter(Boolean))].sort();
    
    return { 
      years, 
      qRatings, 
      publicationTypes, 
      subjectAreas,
      authors,
      departments
    };
  }, [scopePapers, users]);

  // Publications filters
  const hasActiveFilters = useMemo(
    () =>
      searchTerm !== "" ||
      selectedYear !== "all" ||
      selectedQRating !== "all" ||
      selectedPublicationType !== "all" ||
      selectedSubjectArea !== "all",
    [searchTerm, selectedYear, selectedQRating, selectedPublicationType, selectedSubjectArea]
  );

  const filteredPapers = useMemo(() => {
    let data = scopePapers;
    // Optional: restrict by selectedDepartment in scope analytics view
    if (selectedDepartment !== "all") {
      // Keep only papers authored by users in selected department within current scope
      const deptFaculties = new Set(
        users
          .filter((u) => {
            if (selectedCollege !== "all" && u.college !== selectedCollege) return false;
            if (selectedInstitute !== "all" && u.institute !== selectedInstitute) return false;
            return u.department === selectedDepartment;
          })
          .map((u) => u.facultyId)
      );
      data = data.filter((p) => deptFaculties.has(p.facultyId));
    }

    return data.filter((paper) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        term === "" ||
        paper.title?.toLowerCase().includes(term) ||
        paper.journal?.toLowerCase().includes(term) ||
        paper.claimedBy?.toLowerCase().includes(term) ||
        paper.authors?.some((a) => a.name?.toLowerCase().includes(term));
      const matchesYear = selectedYear === "all" || String(paper.year) === String(selectedYear);
      const matchesQ = selectedQRating === "all" || paper.qRating === selectedQRating;
      const matchesType = selectedPublicationType === "all" || paper.publicationType === selectedPublicationType;
      const matchesArea = selectedSubjectArea === "all" || paper.subjectArea === selectedSubjectArea;
      return matchesSearch && matchesYear && matchesQ && matchesType && matchesArea;
    });
  }, [
    scopePapers,
    searchTerm,
    selectedYear,
    selectedQRating,
    selectedPublicationType,
    selectedSubjectArea,
    selectedCollege,
    selectedInstitute,
    selectedDepartment,
    users,
  ]);

  // Stats for header cards and analytics
  const stats = useMemo(() => {
    const papers = filteredPapers;
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
        (selectedInstitute !== "all" && u.institute !== selectedInstitute)
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
      return acc;
    }, {});
    return {
      totalPapers: total,
      activeFaculty: new Set(papers.map((p) => p.facultyId)).size,
      totalFaculty: users.length,
      qDistribution: qDist,
      yearlyTrend,
      subjectDistribution,
      departmentStats,
      q1Percentage: total ? (((qDist.Q1 || 0) / total) * 100).toFixed(1) : 0,
      avgPapersPerFaculty: users.length ? (total / users.length).toFixed(1) : 0,
    };
  }, [filteredPapers, users, selectedCollege, selectedInstitute]);

  // Selection controls
  const handleSelectAll = useCallback(() => {
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
  }, [selectAll, filteredPapers, toast]);

  const handleSelect = useCallback(
    (id) => {
      const next = new Set(selectedPapers);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedPapers(next);
      setSelectAll(next.size === filteredPapers.length);
    },
    [selectedPapers, filteredPapers.length]
  );

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedYear("all");
    setSelectedQRating("all");
    setSelectedPublicationType("all");
    setSelectedSubjectArea("all");
    toast.info("Cleared filters", { duration: 1500 });
  };

  const clearSelection = () => {
    setSelectedPapers(new Set());
    setSelectAll(false);
    toast.info("Cleared selection", { duration: 1500 });
  };

  // Export functionality
  const handleExport = () => {
    try {
      // Get data to export (selected papers or all filtered papers)
      const dataToExport = selectedPapers.size > 0 
        ? scopePapers.filter((p) => selectedPapers.has(p._id))
        : filteredPapers;

      if (!dataToExport.length) {
        toast.warning("No publications to export", { duration: 2000 });
        return;
      }

      // Get selected fields
      const selectedFields = Object.entries(exportFields)
        .filter(([_, selected]) => selected)
        .map(([field, _]) => field);

      if (!selectedFields.length) {
        toast.warning("Please select at least one field to export", { duration: 2000 });
        return;
      }

      // Build header mapping for super admin
      const headerMap = {
        title: "Title",
        authors: "Authors",
        journal: "Journal",
        publisher: "Publisher",
        year: "Year",
        qRating: "Q Rating",
        claimedBy: "Claimed By",
        department: "Department",
        campus: "Campus",
        publicationId: "Publication ID",
        authorNo: "Author Number",
        isStudentScholar: "Student Scholar",
        studentScholars: "Scholar Names",
        typeOfIssue: "Type of Issue",
        doi: "DOI",
        pageNo: "Page Numbers",
        publicationType: "Publication Type",
        subjectArea: "Subject Area",
        subjectCategories: "Subject Categories",
        volume: "Volume",
        issue: "Issue",
      };

      // Create CSV headers
      const headers = selectedFields.map((field) => headerMap[field] || field);

      // Create CSV rows
      const rows = dataToExport.map((paper) => {
        return selectedFields.map((field) => {
          let value = "";

          switch (field) {
            case "authors":
              value = (paper.authors || []).map((a) => a.name).join("; ");
              break;
            case "subjectCategories":
              value = (paper.subjectCategories || []).join("; ");
              break;
            case "studentScholars":
              value = (paper.studentScholars || [])
                .map((s) => typeof s === "string" ? s : s.name)
                .join("; ");
              break;
            case "department":
              const user = users.find(u => u.facultyId === paper.facultyId);
              value = user?.department || "N/A";
              break;
            case "campus":
              const userForCampus = users.find(u => u.facultyId === paper.facultyId);
              value = userForCampus?.college || "N/A";
              break;
            default:
              value = paper[field] ?? "";
          }

          return value;
        });
      });

      // Generate CSV content
      const csvContent = [headers, ...rows]
        .map((row) =>
          row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      // Download CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `superadmin_publications_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Close dialog and show success message
      setExportDialogOpen(false);
      toast.academic(`Successfully exported ${dataToExport.length} publications`, { duration: 2500 });

    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed. Please try again.", { duration: 3000 });
    }
  };

  // Delete (super admin can delete any paper)
  const deletePaper = async (id) => {
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
  };

  // Edit
  const startEdit = (paper) => {
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
  };

  const updatePaper = async () => {
    if (!editData.title?.trim()) return toast.warning("Title is required");
    if (!editData.journal?.trim()) return toast.warning("Journal is required");
    if (!editData.publisher?.trim()) return toast.warning("Publisher is required");
    if (!Number(editData.year)) return toast.warning("Valid year is required");
    if (!PUBLICATION_TYPES.includes(editData.publicationType)) return toast.warning("Invalid publication type");
    if (!Object.keys(SUBJECT_AREAS).includes(editData.subjectArea)) return toast.warning("Invalid subject area");
    const validCats = SUBJECT_AREAS[editData.subjectArea] || [];
    if (!editData.subjectCategories?.length || !editData.subjectCategories.every((c) => validCats.includes(c)))
      return toast.warning("Choose valid subject categories for the selected area");

    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/papers/${editingId}`, editData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      setScopePapers((prev) => prev.map((p) => (p._id === editingId ? { ...p, ...editData } : p)));

      setEditDialogOpen(false);
      setEditingId(null);
      setEditData(null);
      toast.success("Publication updated", { duration: 2200 });
    } catch (e) {
      const msg = e.response?.data?.error || "Update failed";
      toast.error(msg, { duration: 3000 });
    }
  };

  // Finder: select user and load their papers (by institute then filter by facultyId)
  const onSelectUser = async (user) => {
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
    } catch (e) {
      toast.error("Failed to load user publications", { duration: 2800 });
    } finally {
      setSelectedUserLoading(false);
    }
  };

  const selectedUser = useMemo(
    () => (selectedUserId ? users.find((u) => u.facultyId === selectedUserId) : null),
    [users, selectedUserId]
  );

  // Moved these useMemo hooks to top-level to preserve hook order across renders
  const institutesForFinder = useMemo(() => {
    if (userCollegeFilter === "all") return [];
    return Array.from(
      new Set(
        users
          .filter((u) => u.college === userCollegeFilter)
          .map((u) => u.institute)
          .filter(Boolean)
      )
    ).sort();
  }, [userCollegeFilter, users]);

  const departmentsForFinder = useMemo(() => {
    const list = users
      .filter(
        (u) =>
          (userCollegeFilter === "all" || u.college === userCollegeFilter) &&
          (userInstituteFilter === "all" || u.institute === userInstituteFilter)
      )
      .map((u) => u.department)
      .filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [users, userCollegeFilter, userInstituteFilter]);

  const tablePapers = selectedUser ? selectedUserPapers : filteredPapers;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center space-x-3 bg-white p-8 rounded-xl shadow-sm border border-blue-100">
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
          // No tab switch for super admin
          showTabSwitch={false}
          // Finder (we'll render our own below for extra filters)
          showFacultySelector={false}
          users={users}
          institutePapers={scopePapers}
          selectedFacultyId={selectedUserId}
          onSelectFaculty={() => {}}
        />

        {/* Scope selectors */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">College</label>
            <select
              className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={selectedCollege}
              onChange={(e) => {
                setSelectedCollege(e.target.value);
                setSelectedInstitute("all");
                setSelectedDepartment("all");
                setSelectedUserId(null);
                setSelectedUserPapers([]);
              }}
            >
              {colleges.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Institute</label>
            <select
              className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={selectedInstitute}
              onChange={(e) => {
                setSelectedInstitute(e.target.value);
                setSelectedDepartment("all");
                setSelectedUserId(null);
                setSelectedUserPapers([]);
              }}
              disabled={selectedCollege === "all"}
            >
              {institutes.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Department (optional)</label>
            <select
              className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              disabled={selectedCollege === "all" && selectedInstitute === "all"}
            >
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

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
            {/* <StatsCard
              title="Subject Areas"
              value={Object.keys(stats.subjectDistribution || {}).length}
              subtitle="Distinct areas in scope"
              icon={<Shield className="h-8 w-8 text-blue-600" />}
              loading={scopeLoading}
            /> */}
          </div>
        )}

        
        {/* Finder */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Find User</h3>
              <span className="text-xs text-gray-500">Search any faculty or campus admin</span>
            </div>
            {selectedUser && (
              <button
                className="text-sm text-blue-700 hover:underline"
                onClick={() => {
                  setSelectedUserId(null);
                  setSelectedUserPapers([]);
                }}
                title="Clear selected user"
              >
                Clear selection
              </button>
            )}
          </div>

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
            colleges={colleges.filter((c) => c !== "all")}
            institutesForFinder={institutesForFinder}
            departmentsForFinder={departmentsForFinder}
            onSelectUser={onSelectUser}
            selectedUserId={selectedUserId}
          />
        </div>

        

        {/* Analytics */}
        {!selectedUser && (
          <>
            <div className="mb-6">
              <CampusAnalyticsCard stats={stats} loading={scopeLoading} />
            </div>

            {/* NEW: Comparative analytics across colleges/institutes/departments */}
            <div className="mb-6">
              <SuperAdminAnalyticsCard
                papers={filteredPapers}
                users={users}
                selectedCollege={selectedCollege}
                selectedInstitute={selectedInstitute}
                loading={scopeLoading}
              />
            </div>
          </>
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

        {/* Publications filter (applies to scope when no user selected; hidden when viewing a user) */}
        {!selectedUser && (
          <PublicationsFilterCard
            filterOptions={filterOptions}
            searchTerm={searchTerm}
            selectedYear={selectedYear}
            selectedQRating={selectedQRating}
            selectedPublicationType={selectedPublicationType}
            selectedSubjectArea={selectedSubjectArea}
            onSearchTermChange={setSearchTerm}
            onYearChange={setSelectedYear}
            onQRatingChange={setSelectedQRating}
            onPublicationTypeChange={setSelectedPublicationType}
            onSubjectAreaChange={setSelectedSubjectArea}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            selectedCount={selectedPapers.size}
            onClearSelection={clearSelection}
            onBulkDelete={async () => {
              if (!selectedPapers.size) return;
              try {
                const token = localStorage.getItem("token");
                await Promise.all(
                  Array.from(selectedPapers).map((id) =>
                    axios.delete(`http://localhost:5000/api/papers/${id}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    })
                  )
                );
                setScopePapers((prev) => prev.filter((p) => !selectedPapers.has(p._id)));
                setSelectedPapers(new Set());
                setSelectAll(false);
                toast.success("Deleted selected publications", { duration: 2200 });
              } catch {
                toast.error("Some deletions failed", { duration: 2500 });
              }
            }}
            // Export props
            exportDialogOpen={exportDialogOpen}
            onExportDialogOpenChange={setExportDialogOpen}
            exportFields={exportFields}
            onExportFieldsChange={setExportFields}
            onExport={handleExport}
            // Super admin props
            isSuperAdmin={true}
            userRole="super_admin"
            showCampusFilters={true}
          />
        )}

        {/* Publications table */}
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-gray-700 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            {selectedUser ? (
              <>
                Showing{" "}
                <span className="font-semibold text-gray-900">{selectedUserPapers.length}</span> of{" "}
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
          onToggleSelectAll={handleSelectAll}
          onToggleSelect={handleSelect}
          expandedIndex={expanded}
          onToggleExpand={(i) => setExpanded(expanded === i ? null : i)}
          onEdit={startEdit}
          onDelete={deletePaper}
          deletingId={deletingId}
          hasActiveFilters={!selectedUser && hasActiveFilters}
          onClearFilters={clearFilters}
          showAuthorInfo={true}
          users={users}
          currentUser={{ role: "super_admin" }}
          canEditPaper={() => true}
          canDeletePaper={() => true}
        />
      </div>

      {/* Edit Dialog */}
      <EditPublicationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        value={editData}
        onChange={setEditData}
        onSubmit={updatePaper}
        onCancel={() => setEditDialogOpen(false)}
        isSubmitting={false}
        subjectAreas={SUBJECT_AREAS}
        publicationTypes={PUBLICATION_TYPES}
        qRatings={Q_RATINGS}
      />
    </div>
  );
}