import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useToast } from "@/components/Toast";
import {
  RefreshCw,
  Users,
  Award,
  Building2,
  UserCheck,
  Building,
  BookOpen,
  BarChart3,
  X,
} from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";

import DashboardHeader from "../components/dashboardHeader";
import PublicationsFilterCard from "../components/PublicationsFilterCard";
import PublicationsTable from "../components/PublicationTable/PublicationsTable";
import EditPublicationDialog from "../components/PublicationTable/EditPublicationDialog";
import StatsCard from "../components/StatsCard";
import CampusAnalyticsCard from "./components/CampusAnalyticsCard";
import FacultySidebar from "./components/FacultySidebar";
import FacultyDetailsCard from "./components/FacultyDetailsCard";
import { SUBJECT_AREAS } from "@/utils/subjectAreas";

/* Local debounce hook to reduce filtering cost while typing */
function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const PUBLICATION_TYPES = ["scopus", "sci", "webOfScience", "pubmed"];
const Q_RATINGS = ["Q1", "Q2", "Q3", "Q4"];

const CampusAdminDashboard = () => {
  const [institutePapers, setInstitutePapers] = useState([]);
  const [myPapers, setMyPapers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("institute");

  // Analytics section state
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Faculty finder panel open/close
  const [facultyFinderOpen, setFacultyFinderOpen] = useState(false);

  // Faculty finder state
  const [selectedFacultyId, setSelectedFacultyId] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userDeptFilter, setUserDeptFilter] = useState("all");
  const [userHasPubsOnly, setUserHasPubsOnly] = useState(false);

  // UI
  const [expanded, setExpanded] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Institute tab state
  const [instituteSelectedPapers, setInstituteSelectedPapers] = useState(new Set());
  const [instituteSelectAll, setInstituteSelectAll] = useState(false);
  const [instituteSearchTerm, setInstituteSearchTerm] = useState("");
  const [instituteSelectedYear, setInstituteSelectedYear] = useState("all");
  const [instituteSelectedQRating, setInstituteSelectedQRating] = useState("all");
  const [instituteSelectedPublicationType, setInstituteSelectedPublicationType] = useState("all");
  const [instituteSelectedSubjectArea, setInstituteSelectedSubjectArea] = useState("all");
  const [instituteSelectedAuthor, setInstituteSelectedAuthor] = useState("all");
  const [instituteSelectedDepartment, setInstituteSelectedDepartment] = useState("all");

  // My tab state
  const [mySelectedPapers, setMySelectedPapers] = useState(new Set());
  const [mySelectAll, setMySelectAll] = useState(false);
  const [mySearchTerm, setMySearchTerm] = useState("");
  const [mySelectedYear, setMySelectedYear] = useState("all");
  const [mySelectedQRating, setMySelectedQRating] = useState("all");
  const [mySelectedPublicationType, setMySelectedPublicationType] = useState("all");
  const [mySelectedSubjectArea, setMySelectedSubjectArea] = useState("all");

  const debouncedMyText = useDebouncedValue(mySearchTerm, 250);
  const { toast } = useToast();

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);

  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const [exportFields, setExportFields] = useState({
    title: true,
    authors: true,
    journal: true,
    publisher: true,
    year: true,
    qRating: true,
    doi: true,
    publicationType: true,
    subjectArea: true,
    subjectCategories: true,
    claimedBy: true,
    department: true,
    volume: false,
    issue: false,
    pageNo: false,
    publicationId: false,
    authorNo: false,
    isStudentScholar: false,
    studentScholars: false,
    typeOfIssue: false,
  });

  useEffect(() => {
    initializeDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUser(payload);
      await Promise.all([fetchInstitutePapers(payload), fetchMyPapers(), fetchUsers(payload)]);
    } catch (error) {
      console.error("Dashboard initialization error:", error);
      toast.error("Failed to load dashboard", { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutePapers = async (user) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/papers/institute", {
        headers: { Authorization: `Bearer ${token}` },
        params: { college: user.college, institute: user.institute },
      });
      setInstitutePapers(response.data || []);
    } catch (error) {
      console.error("Fetch institute papers error:", error);
      toast.error("Failed to fetch institute publications");
      setInstitutePapers([]);
    }
  };

  const fetchMyPapers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/papers/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyPapers(response.data || []);
    } catch (error) {
      console.error("Fetch my papers error:", error);
      toast.error("Failed to fetch your publications");
      setMyPapers([]);
    }
  };

  const fetchUsers = async (user) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        params: { college: user.college, institute: user.institute, role: "faculty" },
      });
      setUsers(response.data || []);
    } catch (error) {
      console.error("Fetch users error:", error);
      toast.error("Failed to fetch faculty data");
      setUsers([]);
    }
  };

  const canEditPaper = (paper) => !!currentUser && !!paper && paper.facultyId === currentUser.facultyId;
  const canDeletePaper = (paper) => !!currentUser && !!paper && paper.facultyId === currentUser.facultyId;

  // Map for O(1) department lookup in filters
  const facultyDeptMap = useMemo(() => {
    const map = new Map();
    for (const u of users || []) {
      if (u.facultyId) map.set(u.facultyId, u.department || "");
    }
    return map;
  }, [users]);

  // Filter options for institute
  const instituteFilterOptions = useMemo(() => {
    const years = [...new Set(institutePapers.map((p) => Number(p.year)).filter(Boolean))].sort((a, b) => b - a);
    const qRatings = [...new Set(institutePapers.map((p) => p.qRating).filter(Boolean))].sort();
    const publicationTypes = [...new Set(institutePapers.map((p) => p.publicationType).filter(Boolean))].sort();
    const subjectAreas = [...new Set(institutePapers.map((p) => p.subjectArea).filter(Boolean))].sort();
    const authors = [...new Set(institutePapers.map((p) => p.claimedBy).filter(Boolean))].sort();
    const departments = [...new Set(users.map((u) => u.department).filter(Boolean))].sort();
    return { years, qRatings, publicationTypes, subjectAreas, authors, departments };
  }, [institutePapers, users]);

  // Filter options for my
  const myFilterOptions = useMemo(() => {
    const years = [...new Set(myPapers.map((p) => Number(p.year)).filter(Boolean))].sort((a, b) => b - a);
    const qRatings = [...new Set(myPapers.map((p) => p.qRating).filter(Boolean))].sort();
    const publicationTypes = [...new Set(myPapers.map((p) => p.publicationType).filter(Boolean))].sort();
    const subjectAreas = [...new Set(myPapers.map((p) => p.subjectArea).filter(Boolean))].sort();
    return { years, qRatings, publicationTypes, subjectAreas };
  }, [myPapers]);

  // Active filters
  const hasInstituteActiveFilters = useMemo(
    () =>
      selectedFacultyId !== null ||
      instituteSearchTerm !== "" ||
      instituteSelectedYear !== "all" ||
      instituteSelectedQRating !== "all" ||
      instituteSelectedPublicationType !== "all" ||
      instituteSelectedSubjectArea !== "all" ||
      instituteSelectedAuthor !== "all" ||
      instituteSelectedDepartment !== "all",
    [
      selectedFacultyId,
      instituteSearchTerm,
      instituteSelectedYear,
      instituteSelectedQRating,
      instituteSelectedPublicationType,
      instituteSelectedSubjectArea,
      instituteSelectedAuthor,
      instituteSelectedDepartment,
    ]
  );

  const hasMyActiveFilters = useMemo(
    () =>
      mySearchTerm !== "" ||
      mySelectedYear !== "all" ||
      mySelectedQRating !== "all" ||
      mySelectedPublicationType !== "all" ||
      mySelectedSubjectArea !== "all",
    [mySearchTerm, mySelectedYear, mySelectedQRating, mySelectedPublicationType, mySelectedSubjectArea]
  );

  // Filter helpers
  const matchesText = (paper, lowerTerm) => {
    if (!lowerTerm) return true;
    if (paper.title?.toLowerCase().includes(lowerTerm)) return true;
    if (paper.journal?.toLowerCase().includes(lowerTerm)) return true;
    if (paper.claimedBy?.toLowerCase().includes(lowerTerm)) return true;
    if (Array.isArray(paper.authors) && paper.authors.some((a) => a.name?.toLowerCase().includes(lowerTerm))) return true;
    return false;
  };

  // Filtered institute papers
  const filteredInstitutePapers = useMemo(() => {
    const lowerTerm = (instituteSearchTerm || "").trim().toLowerCase();
    const scope = selectedFacultyId
      ? institutePapers.filter((p) => p.facultyId === selectedFacultyId)
      : institutePapers;

    return scope.filter((paper) => {
      if (!matchesText(paper, lowerTerm)) return false;
      if (instituteSelectedYear !== "all" && String(paper.year) !== String(instituteSelectedYear)) return false;
      if (instituteSelectedQRating !== "all" && paper.qRating !== instituteSelectedQRating) return false;
      if (instituteSelectedPublicationType !== "all" && paper.publicationType !== instituteSelectedPublicationType) return false;
      if (instituteSelectedSubjectArea !== "all" && paper.subjectArea !== instituteSelectedSubjectArea) return false;
      if (instituteSelectedAuthor !== "all" && paper.claimedBy !== instituteSelectedAuthor) return false;

      if (instituteSelectedDepartment !== "all") {
        const dep = facultyDeptMap.get(paper.facultyId);
        if (dep !== instituteSelectedDepartment) return false;
      }
      return true;
    });
  }, [
    institutePapers,
    selectedFacultyId,
    instituteSearchTerm,
    instituteSelectedYear,
    instituteSelectedQRating,
    instituteSelectedPublicationType,
    instituteSelectedSubjectArea,
    instituteSelectedAuthor,
    instituteSelectedDepartment,
    facultyDeptMap,
  ]);

  // Filtered my papers
  const filteredMyPapers = useMemo(() => {
    const lowerTerm = (debouncedMyText || "").trim().toLowerCase();
    return myPapers.filter((paper) => {
      if (!matchesText(paper, lowerTerm)) return false;
      if (mySelectedYear !== "all" && String(paper.year) !== String(mySelectedYear)) return false;
      if (mySelectedQRating !== "all" && paper.qRating !== mySelectedQRating) return false;
      if (mySelectedPublicationType !== "all" && paper.publicationType !== mySelectedPublicationType) return false;
      if (mySelectedSubjectArea !== "all" && paper.subjectArea !== mySelectedSubjectArea) return false;
      return true;
    });
  }, [
    myPapers,
    debouncedMyText,
    mySelectedYear,
    mySelectedQRating,
    mySelectedPublicationType,
    mySelectedSubjectArea,
  ]);

  // Selected faculty
  const selectedFaculty = useMemo(
    () => (selectedFacultyId ? users.find((u) => u.facultyId === selectedFacultyId) || null : null),
    [users, selectedFacultyId]
  );
  const selectedFacultyAllPapers = useMemo(
    () => (selectedFacultyId ? institutePapers.filter((p) => p.facultyId === selectedFacultyId) : []),
    [institutePapers, selectedFacultyId]
  );

  // Stats
  const campusStats = useMemo(() => {
    const totalPapers = institutePapers.length;
    const myTotalPapers = myPapers.length;
    const totalFaculty = users.length;
    const activeFaculty = users.filter((u) => institutePapers.some((p) => p.facultyId === u.facultyId)).length;

    const qDistribution = institutePapers.reduce((acc, paper) => {
      acc[paper.qRating] = (acc[paper.qRating] || 0) + 1;
      return acc;
    }, {});

    const myQDistribution = myPapers.reduce((acc, paper) => {
      acc[paper.qRating] = (acc[paper.qRating] || 0) + 1;
      return acc;
    }, {});

    const yearlyTrend = institutePapers.reduce((acc, paper) => {
      acc[paper.year] = (acc[paper.year] || 0) + 1;
      return acc;
    }, {});

    const subjectDistribution = institutePapers.reduce((acc, paper) => {
      acc[paper.subjectArea] = (acc[paper.subjectArea] || 0) + 1;
      return acc;
    }, {});

    const departmentStats = users.reduce((acc, user) => {
      const userPapers = institutePapers.filter((p) => p.facultyId === user.facultyId);
      const dep = user.department || "—";
      if (!acc[dep]) {
        acc[dep] = { faculty: 0, papers: 0, q1Papers: 0, recentPapers: 0 };
      }
      acc[dep].faculty++;
      acc[dep].papers += userPapers.length;
      acc[dep].q1Papers += userPapers.filter((p) => p.qRating === "Q1").length;
      acc[dep].recentPapers += userPapers.filter((p) => Number(p.year) >= new Date().getFullYear() - 1).length;
      return acc;
    }, {});

    return {
      totalPapers,
      myTotalPapers,
      totalFaculty,
      activeFaculty,
      qDistribution,
      myQDistribution,
      yearlyTrend,
      subjectDistribution,
      departmentStats,
      avgPapersPerFaculty: totalFaculty > 0 ? (totalPapers / totalFaculty).toFixed(1) : 0,
      q1Percentage: totalPapers > 0 ? (((qDistribution || {}).Q1 || 0) / totalPapers * 100).toFixed(1) : 0,
      myQ1Percentage: myTotalPapers > 0 ? (((myQDistribution || {}).Q1 || 0) / myTotalPapers * 100).toFixed(1) : 0,
    };
  }, [institutePapers, myPapers, users]);

  const myStats = useMemo(() => ({ total: myPapers.length }), [myPapers]);

  // Selections (restriction removed: campus admin can select/check any paper)
  const handleInstituteSelectAll = useCallback(() => {
    if (instituteSelectAll) {
      setInstituteSelectedPapers(new Set());
      setInstituteSelectAll(false);
      toast.info("Deselected all", { duration: 1500 });
    } else {
      // Allow all visible (filtered) papers to be selected, not just own
      const ids = new Set(filteredInstitutePapers.map((p) => p._id));
      setInstituteSelectedPapers(ids);
      setInstituteSelectAll(ids.size === filteredInstitutePapers.length && ids.size > 0);
      toast.success(`Selected ${ids.size} visible`, { duration: 1500 });
    }
  }, [instituteSelectAll, filteredInstitutePapers, toast]);

  const handleInstituteSelect = useCallback(
    (id) => {
      // Allow selection of any paper in filtered list, no restriction
      const next = new Set(instituteSelectedPapers);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setInstituteSelectedPapers(next);
      setInstituteSelectAll(next.size === filteredInstitutePapers.length && next.size > 0);
    },
    [instituteSelectedPapers, filteredInstitutePapers.length]
  );

  const handleMySelectAll = useCallback(() => {
    if (mySelectAll) {
      setMySelectedPapers(new Set());
      setMySelectAll(false);
      toast.info("Deselected all", { duration: 1500 });
    } else {
      const ids = new Set(filteredMyPapers.map((p) => p._id));
      setMySelectedPapers(ids);
      setMySelectAll(ids.size === filteredMyPapers.length);
      toast.success(`Selected ${ids.size} visible`, { duration: 1500 });
    }
  }, [mySelectAll, filteredMyPapers, toast]);

  const handleMySelect = useCallback(
    (id) => {
      const next = new Set(mySelectedPapers);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setMySelectedPapers(next);
      setMySelectAll(next.size === filteredMyPapers.length);
    },
    [mySelectedPapers, filteredMyPapers.length]
  );

  // Clear helpers
  const clearInstituteFilters = () => {
    setInstituteSearchTerm("");
    setInstituteSelectedYear("all");
    setInstituteSelectedQRating("all");
    setInstituteSelectedPublicationType("all");
    setInstituteSelectedSubjectArea("all");
    setInstituteSelectedAuthor("all");
    setInstituteSelectedDepartment("all");
    toast.info("Cleared institute filters", { duration: 1500 });
  };
  const clearMyFilters = () => {
    setMySearchTerm("");
    setMySelectedYear("all");
    setMySelectedQRating("all");
    setMySelectedPublicationType("all");
    setMySelectedSubjectArea("all");
    toast.info("Cleared my filters", { duration: 1500 });
  };
  const clearInstituteSelection = () => {
    setInstituteSelectedPapers(new Set());
    setInstituteSelectAll(false);
    toast.info("Cleared institute selection", { duration: 1500 });
  };
  const clearMySelection = () => {
    setMySelectedPapers(new Set());
    setMySelectAll(false);
    toast.info("Cleared my selection", { duration: 1500 });
  };

  // Delete operations
  const deletePaper = async (id) => {
    const paper = [...institutePapers, ...myPapers].find((p) => p._id === id);
    if (!paper || !canDeletePaper(paper)) {
      toast.error("You can only delete your own publications", { duration: 2500 });
      return;
    }
    setDeletingId(id);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/papers/${id}`, { headers: { Authorization: `Bearer ${token}` } });

      setInstitutePapers((prev) => prev.filter((p) => p._id !== id));
      setMyPapers((prev) => prev.filter((p) => p._id !== id));
      setInstituteSelectedPapers((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setMySelectedPapers((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Publication deleted", { duration: 2000 });
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Delete failed";
      toast.error(errorMessage, { duration: 2500 });
    } finally {
      setDeletingId(null);
    }
  };

  const bulkDeleteInstitute = async () => {
    if (!instituteSelectedPapers.size) return;
    const selectedPapers = institutePapers.filter((p) => instituteSelectedPapers.has(p._id));
    const unauthorizedPapers = selectedPapers.filter((p) => !canDeletePaper(p));
    if (unauthorizedPapers.length > 0) {
      toast.error("You can only delete your own publications", { duration: 2500 });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        Array.from(instituteSelectedPapers).map((id) =>
          axios.delete(`http://localhost:5000/api/papers/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        )
      );
      setInstitutePapers((prev) => prev.filter((p) => !instituteSelectedPapers.has(p._id)));
      setMyPapers((prev) => prev.filter((p) => !instituteSelectedPapers.has(p._id)));
      setInstituteSelectedPapers(new Set());
      setInstituteSelectAll(false);
      toast.success("Deleted selected publications", { duration: 2200 });
    } catch {
      toast.error("Some deletions failed", { duration: 2500 });
    }
  };

  const bulkDeleteMy = async () => {
    if (!mySelectedPapers.size) return;
    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        Array.from(mySelectedPapers).map((id) =>
          axios.delete(`http://localhost:5000/api/papers/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        )
      );
      setMyPapers((prev) => prev.filter((p) => !mySelectedPapers.has(p._id)));
      setInstitutePapers((prev) => prev.filter((p) => !mySelectedPapers.has(p._id)));
      setMySelectedPapers(new Set());
      setMySelectAll(false);
      toast.success("Deleted selected publications", { duration: 2200 });
    } catch {
      toast.error("Some deletions failed", { duration: 2500 });
    }
  };

  // Edit
  const startEdit = (paper) => {
    if (!canEditPaper(paper)) {
      toast.warning("You can only edit your own publications", { duration: 2500 });
      return;
    }
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

      setInstitutePapers((prev) => prev.map((p) => (p._id === editingId ? { ...p, ...editData } : p)));
      setMyPapers((prev) => prev.map((p) => (p._id === editingId ? { ...p, ...editData } : p)));

      setEditDialogOpen(false);
      setEditingId(null);
      setEditData(null);
      toast.success("Publication updated", { duration: 2200 });
    } catch (e) {
      const errorMessage = e.response?.data?.error || "Update failed";
      toast.error(errorMessage, { duration: 3000 });
    }
  };

  const exportSelectedData = () => {
    const isInstituteTab = activeTab === "institute";
    const data = isInstituteTab
      ? instituteSelectedPapers.size
        ? institutePapers.filter((p) => instituteSelectedPapers.has(p._id))
        : filteredInstitutePapers
      : mySelectedPapers.size
      ? myPapers.filter((p) => mySelectedPapers.has(p._id))
      : filteredMyPapers;

    if (!data.length) return toast.warning("No publications to export");

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
      volume: "Volume",
      issue: "Issue",
      pageNo: "Page Numbers",
      publicationId: "Publication ID",
      authorNo: "Author Number",
      isStudentScholar: "Student Scholar",
      studentScholars: "Scholar Names",
      typeOfIssue: "Type of Issue",
    };

    const headers = Object.entries(exportFields)
      .filter(([, include]) => include)
      .map(([key]) => headerMap[key]);

    const rows = data.map((p) =>
      Object.entries(exportFields)
        .filter(([, include]) => include)
        .map(([field]) => {
          switch (field) {
            case "authors":
              return (p.authors || []).map((a) => a.name).join("; ");
            case "subjectCategories":
              return (p.subjectCategories || []).join("; ");
            case "studentScholars":
              return (p.studentScholars || []).map((s) => (typeof s === "string" ? s : s.name)).join("; ");
            case "department":
              return facultyDeptMap.get(p.facultyId) || "";
            default:
              return p[field] ?? "";
          }
        })
    );

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}_publications_${currentUser?.college || "campus"}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDialogOpen(false);
    toast.academic(`Exported ${data.length} publications`, { duration: 2200 });
  };

  const onSelectFaculty = (fid) => {
    setSelectedFacultyId(fid);
    setActiveTab("institute");
    setExpanded(null);
    setInstituteSelectedPapers(new Set());
    setInstituteSelectAll(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center space-x-3 bg-white p-8 rounded-xl shadow-sm border border-blue-100">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Loading Campus Dashboard</h3>
            <p className="text-gray-600">Analyzing institute publications…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <DashboardHeader
          title="Campus Admin Dashboard"
          subtitle={`${currentUser?.college} - ${currentUser?.institute} Publications Management`}
          userName={currentUser?.fullName}
          dateTime={new Date().toLocaleString()}
          icon={<Building2 className="h-6 w-6" />}
          showTabSwitch={currentUser?.role === "campus_admin"}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onShowAnalytics={() => setShowAnalytics(true)}
          facultyFinderOpen={facultyFinderOpen}
          onFacultyFinderOpenChange={setFacultyFinderOpen}
        />

        {/* Analytics Section */}
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
                  type="button"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </header>
              <main className="p-8 bg-gradient-to-tr from-white/70 to-blue-50 rounded-b-2xl">
                <div className="grid grid-cols-1 gap-y-8">
                  <CampusAnalyticsCard stats={campusStats} loading={loading} />
                </div>
              </main>
            </div>
          </section>
        )}

        {/* Faculty Finder Sidebar Drawer (just like super admin) */}
        {facultyFinderOpen && (
          <div>
            <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-full md:w-[350px] bg-white shadow-2xl flex flex-col overflow-y-scroll scrollbar-hide transition-all duration-300">
              <FacultySidebar
                users={users}
                institutePapers={institutePapers}
                departments={instituteFilterOptions.departments}
                selectedFacultyId={selectedFacultyId}
                onSelect={onSelectFaculty}
                userSearchTerm={userSearchTerm}
                onUserSearchTermChange={setUserSearchTerm}
                userDeptFilter={userDeptFilter}
                onUserDeptFilterChange={setUserDeptFilter}
                userHasPubsOnly={userHasPubsOnly}
                onUserHasPubsOnlyChange={setUserHasPubsOnly}
                onCollapse={() => setFacultyFinderOpen(false)}
                loading={loading}
              />
            </div>
          </div>
        )}

        {activeTab === "my" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Total Publications"
              value={myStats.total}
              subtitle="All research papers"
              icon={<BookOpen className="h-8 w-8 text-blue-600" />}
              loading={loading}
            />
          </div>
        ) : (
          !selectedFacultyId && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Institute Publications"
                value={campusStats.totalPapers}
                subtitle={`Avg ${campusStats.avgPapersPerFaculty} per faculty`}
                icon={<Building className="h-8 w-8 text-blue-600" />}
                loading={loading}
              />
              <StatsCard
                title="My Publications"
                value={campusStats.myTotalPapers}
                subtitle={`${campusStats.myQ1Percentage}% Q1 papers`}
                icon={<UserCheck className="h-8 w-8 text-blue-600" />}
                loading={loading}
              />
              <StatsCard
                title="Q1 Publications"
                value={(campusStats.qDistribution || {}).Q1 || 0}
                subtitle={`${campusStats.q1Percentage}% of total`}
                icon={<Award className="h-8 w-8 text-blue-600" />}
                loading={loading}
              />
            </div>
          )
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Institute Publications */}
          <TabsContent value="institute" className="space-y-6">
            {/* Main area */}
            <div className="space-y-6">
              {selectedFaculty ? (
                <>
                  <FacultyDetailsCard
                    faculty={selectedFaculty}
                    papers={selectedFacultyAllPapers}
                    onClear={() => onSelectFaculty(null)}
                  />

                  <PublicationsFilterCard
                    filterOptions={{
                      years: instituteFilterOptions.years,
                      qRatings: instituteFilterOptions.qRatings,
                      publicationTypes: instituteFilterOptions.publicationTypes,
                      subjectAreas: instituteFilterOptions.subjectAreas,
                      authors: [],
                      departments: [],
                    }}
                    searchTerm={instituteSearchTerm}
                    selectedYear={instituteSelectedYear}
                    selectedQRating={instituteSelectedQRating}
                    selectedPublicationType={instituteSelectedPublicationType}
                    selectedSubjectArea={instituteSelectedSubjectArea}
                    selectedAuthor={"all"}
                    selectedDepartment={"all"}
                    onSearchTermChange={setInstituteSearchTerm}
                    onYearChange={setInstituteSelectedYear}
                    onQRatingChange={setInstituteSelectedQRating}
                    onPublicationTypeChange={setInstituteSelectedPublicationType}
                    onSubjectAreaChange={setInstituteSelectedSubjectArea}
                    onAuthorChange={() => {}}
                    onDepartmentChange={() => {}}
                    hasActiveFilters={hasInstituteActiveFilters}
                    onClearFilters={clearInstituteFilters}
                    selectedCount={instituteSelectedPapers.size}
                    onClearSelection={clearInstituteSelection}
                    onBulkDelete={bulkDeleteInstitute}
                    exportDialogOpen={exportDialogOpen}
                    onExportDialogOpenChange={setExportDialogOpen}
                    exportFields={exportFields}
                    onExportFieldsChange={setExportFields}
                    onExport={exportSelectedData}
                    showCampusFilters={false}
                  />

                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-semibold text-gray-900">{filteredInstitutePapers.length}</span>{" "}
                      of <span className="font-semibold text-gray-900">{selectedFacultyAllPapers.length}</span>{" "}
                      publications for{" "}
                      <span className="font-medium text-blue-700">{selectedFaculty.fullName}</span>
                      {instituteSelectedPapers.size > 0 && (
                        <span className="text-blue-600">
                          {" "}
                          • <span className="font-semibold">{instituteSelectedPapers.size}</span> selected
                        </span>
                      )}
                    </p>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{currentUser?.institute}</span> •{" "}
                      <span className="font-medium">{currentUser?.college}</span>
                    </div>
                  </div>

                  <PublicationsTable
                    papers={filteredInstitutePapers}
                    selectedPapers={instituteSelectedPapers}
                    selectAll={instituteSelectAll}
                    onToggleSelectAll={handleInstituteSelectAll}
                    onToggleSelect={handleInstituteSelect}
                    expandedIndex={expanded}
                    onToggleExpand={(i) => setExpanded(expanded === i ? null : i)}
                    onEdit={startEdit}
                    onDelete={deletePaper}
                    deletingId={deletingId}
                    hasActiveFilters={hasInstituteActiveFilters}
                    onClearFilters={clearInstituteFilters}
                    showAuthorInfo={true}
                    users={users}
                    currentUser={currentUser}
                    canEditPaper={canEditPaper}
                    canDeletePaper={canDeletePaper}
                  />
                </>
              ) : (
                <>
                  <PublicationsFilterCard
                    filterOptions={instituteFilterOptions}
                    searchTerm={instituteSearchTerm}
                    selectedYear={instituteSelectedYear}
                    selectedQRating={instituteSelectedQRating}
                    selectedPublicationType={instituteSelectedPublicationType}
                    selectedSubjectArea={instituteSelectedSubjectArea}
                    selectedAuthor={instituteSelectedAuthor}
                    selectedDepartment={instituteSelectedDepartment}
                    onSearchTermChange={setInstituteSearchTerm}
                    onYearChange={setInstituteSelectedYear}
                    onQRatingChange={setInstituteSelectedQRating}
                    onPublicationTypeChange={setInstituteSelectedPublicationType}
                    onSubjectAreaChange={setInstituteSelectedSubjectArea}
                    onAuthorChange={setInstituteSelectedAuthor}
                    onDepartmentChange={setInstituteSelectedDepartment}
                    hasActiveFilters={hasInstituteActiveFilters}
                    onClearFilters={clearInstituteFilters}
                    selectedCount={instituteSelectedPapers.size}
                    onClearSelection={clearInstituteSelection}
                    onBulkDelete={bulkDeleteInstitute}
                    exportDialogOpen={exportDialogOpen}
                    onExportDialogOpenChange={setExportDialogOpen}
                    exportFields={exportFields}
                    onExportFieldsChange={setExportFields}
                    onExport={exportSelectedData}
                    showCampusFilters={true}
                  />

                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <Building className="h-4 w-4 text-blue-600" />
                      Showing{" "}
                      <span className="font-semibold text-gray-900">{filteredInstitutePapers.length}</span> of{" "}
                      <span className="font-semibold text-gray-900">{institutePapers.length}</span> institute
                      publications
                      {instituteSelectedPapers.size > 0 && (
                        <span className="text-blue-600">
                          {" "}
                          • <span className="font-semibold">{instituteSelectedPapers.size}</span> selected
                        </span>
                      )}
                    </p>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{currentUser?.institute}</span> •{" "}
                      <span className="font-medium">{currentUser?.college}</span>
                    </div>
                  </div>

                  <PublicationsTable
                    papers={filteredInstitutePapers}
                    selectedPapers={instituteSelectedPapers}
                    selectAll={instituteSelectAll}
                    onToggleSelectAll={handleInstituteSelectAll}
                    onToggleSelect={handleInstituteSelect}
                    expandedIndex={expanded}
                    onToggleExpand={(i) => setExpanded(expanded === i ? null : i)}
                    onEdit={startEdit}
                    onDelete={deletePaper}
                    deletingId={deletingId}
                    hasActiveFilters={hasInstituteActiveFilters}
                    onClearFilters={clearInstituteFilters}
                    showAuthorInfo={true}
                    users={users}
                    currentUser={currentUser}
                    canEditPaper={canEditPaper}
                    canDeletePaper={canDeletePaper}
                  />
                </>
              )}
            </div>
          </TabsContent>

          {/* My Publications */}
          <TabsContent value="my" className="space-y-6">
            <PublicationsFilterCard
              filterOptions={myFilterOptions}
              searchTerm={mySearchTerm}
              selectedYear={mySelectedYear}
              selectedQRating={mySelectedQRating}
              selectedPublicationType={mySelectedPublicationType}
              selectedSubjectArea={mySelectedSubjectArea}
              onSearchTermChange={setMySearchTerm}
              onYearChange={setMySelectedYear}
              onQRatingChange={setMySelectedQRating}
              onPublicationTypeChange={setMySelectedPublicationType}
              onSubjectAreaChange={setMySelectedSubjectArea}
              hasActiveFilters={hasMyActiveFilters}
              onClearFilters={clearMyFilters}
              selectedCount={mySelectedPapers.size}
              onClearSelection={clearMySelection}
              onBulkDelete={bulkDeleteMy}
              exportDialogOpen={exportDialogOpen}
              onExportDialogOpenChange={setExportDialogOpen}
              exportFields={exportFields}
              onExportFieldsChange={setExportFields}
              onExport={exportSelectedData}
              showCampusFilters={false}
            />

            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-600" />
                Showing <span className="font-semibold text-gray-900">{filteredMyPapers.length}</span> of{" "}
                <span className="font-semibold text-gray-900">{myPapers.length}</span> your publications
                {mySelectedPapers.size > 0 && (
                  <span className="text-blue-600">
                    {" "}
                    • <span className="font-semibold">{mySelectedPapers.size}</span> selected
                  </span>
                )}
              </p>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{currentUser?.fullName}</span>
              </div>
            </div>

            <PublicationsTable
              papers={filteredMyPapers}
              selectedPapers={mySelectedPapers}
              selectAll={mySelectAll}
              onToggleSelectAll={handleMySelectAll}
              onToggleSelect={handleMySelect}
              expandedIndex={expanded}
              onToggleExpand={(i) => setExpanded(expanded === i ? null : i)}
              onEdit={startEdit}
              onDelete={deletePaper}
              deletingId={deletingId}
              hasActiveFilters={hasMyActiveFilters}
              onClearFilters={clearMyFilters}
              showAuthorInfo={false}
              users={users}
              currentUser={currentUser}
              canEditPaper={canEditPaper}
              canDeletePaper={canDeletePaper}
            />
          </TabsContent>
        </Tabs>
      </div>

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
};

export default CampusAdminDashboard;