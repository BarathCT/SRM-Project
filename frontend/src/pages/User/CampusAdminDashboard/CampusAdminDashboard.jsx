import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useToast } from "@/components/Toast";
import {
  Users,
  Award,
  Building2,
  UserCheck,
  Building,
  BookOpen,
  BarChart3,
  X,
  FileText,
  Presentation,
} from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";

import DashboardHeader from "../components/DashboardHeader";
import PublicationsFilterCard from "../components/PublicationsFilterCard";
import PublicationsTable from "../components/PublicationTable/PublicationsTable";
import BookChaptersTable from "../components/PublicationTable/BookChaptersTable";
import ConferencePapersTable from "../components/PublicationTable/ConferencePapersTable";
import EditPublicationDialog from "../components/PublicationTable/EditPublicationDialog";
import EditBookChapterDialog from "../components/PublicationTable/EditBookChapterDialog";
import EditConferencePaperDialog from "../components/PublicationTable/EditConferencePaperDialog";
import StatsCard from "../components/StatsCard";
import CampusAnalyticsCard from "./components/CampusAnalyticsCard";
import FacultyDetailsCard from "./components/FacultyDetailsCard";
import UserFinderSidebar from "../components/UserFinderSidebar";
import { SUBJECT_AREAS } from "@/utils/subjectAreas";
import api from '@/lib/api';
import { PageLoader } from '@/components/ui/loading';

/* Local debounce hook to reduce filtering cost while typing */
function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PUBLICATION_TYPES = ["scopus", "sci", "webOfScience"];
const Q_RATINGS = ["Q1", "Q2", "Q3", "Q4"];
const PUB_TABS = [
  { id: "papers", label: "Research Papers", icon: FileText },
  { id: "bookChapters", label: "Book Chapters", icon: BookOpen },
  { id: "conferencePapers", label: "Conference Papers", icon: Presentation },
];

const CampusAdminDashboard = () => {
  const [institutePapers, setInstitutePapers] = useState([]);
  const [myPapers, setMyPapers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("institute");

  // Publication type tab (Research Papers vs Book Chapters vs Conference Papers)
  const [activePublicationType, setActivePublicationType] = useState("papers");

  // Book Chapters state
  const [instituteBookChapters, setInstituteBookChapters] = useState([]);
  const [myBookChapters, setMyBookChapters] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState(new Set());
  const [selectAllChapters, setSelectAllChapters] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [deletingChapterId, setDeletingChapterId] = useState(null);
  const [editChapterOpen, setEditChapterOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);

  // Conference Papers state
  const [instituteConference, setInstituteConference] = useState([]);
  const [myConference, setMyConference] = useState([]);
  const [selectedConference, setSelectedConference] = useState(new Set());
  const [selectAllConference, setSelectAllConference] = useState(false);
  const [expandedConference, setExpandedConference] = useState(null);
  const [deletingConferenceId, setDeletingConferenceId] = useState(null);
  const [editConferenceOpen, setEditConferenceOpen] = useState(false);
  const [editingConference, setEditingConference] = useState(null);

  // Analytics section state
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Faculty finder panel open/close
  const [facultyFinderOpen, setFacultyFinderOpen] = useState(false);

  // Faculty finder filter state (DECOUPLED)
  const [userFinderFilters, setUserFinderFilters] = useState({
    searchTerm: "",
    deptFilter: "all",
  });

  // UI
  const [expanded, setExpanded] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Institute tab state (DECOUPLED)
  const [instituteSelectedPapers, setInstituteSelectedPapers] = useState(new Set());
  const [instituteSelectAll, setInstituteSelectAll] = useState(false);
  const [instituteFilters, setInstituteFilters] = useState({
    searchTerm: "",
    selectedYear: "all",
    selectedQRating: "all",
    selectedPublicationType: "all",
    selectedSubjectArea: "all",
    selectedSubjectCategory: "all",
    selectedAuthor: "all",
    selectedDepartment: "all",
  });

  // My tab state
  const [mySelectedPapers, setMySelectedPapers] = useState(new Set());
  const [mySelectAll, setMySelectAll] = useState(false);
  const [myFilters, setMyFilters] = useState({
    searchTerm: "",
    selectedYear: "all",
    selectedQRating: "all",
    selectedPublicationType: "all",
    selectedSubjectArea: "all",
    selectedSubjectCategory: "all",
  });

  const debouncedMyText = useDebouncedValue(myFilters.searchTerm, 250);
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

  // Faculty selection in details card
  const [selectedFacultyId, setSelectedFacultyId] = useState(null);

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
      await Promise.all([
        fetchInstitutePapers(payload),
        fetchMyPapers(),
        fetchUsers(payload),
        fetchInstituteBookChapters(payload),
        fetchMyBookChapters(),
        fetchInstituteConference(payload),
        fetchMyConference()
      ]);
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
      const response = await api.get('/papers/institute', {
        headers: { Authorization: `Bearer ${token}` },
        params: { college: user.college, institute: user.institute },
      });
      setInstitutePapers(response.data || []);
    } catch (error) {
      console.error("Fetch institute papers error:", error);
      setInstitutePapers([]);
    }
  };

  const fetchMyPapers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get('/papers/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyPapers(response.data || []);
    } catch (error) {
      console.error("Fetch my papers error:", error);
      setMyPapers([]);
    }
  };

  const fetchInstituteBookChapters = async (user) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get('/book-chapters/institute', {
        headers: { Authorization: `Bearer ${token}` },
        params: { college: user.college, institute: user.institute },
      });
      setInstituteBookChapters(response.data || []);
    } catch {
      setInstituteBookChapters([]);
    }
  };

  const fetchMyBookChapters = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get('/book-chapters/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyBookChapters(response.data || []);
    } catch {
      setMyBookChapters([]);
    }
  };

  const fetchInstituteConference = async (user) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get('/conference-papers/institute', {
        headers: { Authorization: `Bearer ${token}` },
        params: { college: user.college, institute: user.institute },
      });
      setInstituteConference(response.data || []);
    } catch {
      setInstituteConference([]);
    }
  };

  const fetchMyConference = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get('/conference-papers/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyConference(response.data || []);
    } catch {
      setMyConference([]);
    }
  };

  const fetchUsers = async (user) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: { college: user.college, institute: user.institute, role: "faculty" },
      });
      setUsers(response.data || []);
    } catch (error) {
      console.error("Fetch users error:", error);
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
      instituteFilters.searchTerm !== "" ||
      instituteFilters.selectedYear !== "all" ||
      instituteFilters.selectedQRating !== "all" ||
      instituteFilters.selectedPublicationType !== "all" ||
      instituteFilters.selectedSubjectArea !== "all" ||
      instituteFilters.selectedSubjectCategory !== "all" ||
      instituteFilters.selectedAuthor !== "all" ||
      instituteFilters.selectedDepartment !== "all",
    [
      selectedFacultyId,
      instituteFilters.searchTerm,
      instituteFilters.selectedYear,
      instituteFilters.selectedQRating,
      instituteFilters.selectedPublicationType,
      instituteFilters.selectedSubjectArea,
      instituteFilters.selectedSubjectCategory,
      instituteFilters.selectedAuthor,
      instituteFilters.selectedDepartment,
    ]
  );

  const hasMyActiveFilters = useMemo(
    () =>
      myFilters.searchTerm !== "" ||
      myFilters.selectedYear !== "all" ||
      myFilters.selectedQRating !== "all" ||
      myFilters.selectedPublicationType !== "all" ||
      myFilters.selectedSubjectArea !== "all" ||
      myFilters.selectedSubjectCategory !== "all",
    [
      myFilters.searchTerm,
      myFilters.selectedYear,
      myFilters.selectedQRating,
      myFilters.selectedPublicationType,
      myFilters.selectedSubjectArea,
      myFilters.selectedSubjectCategory,
    ]
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
    const lowerTerm = (instituteFilters.searchTerm || "").trim().toLowerCase();
    const scope = selectedFacultyId
      ? institutePapers.filter((p) => p.facultyId === selectedFacultyId)
      : institutePapers;

    return scope.filter((paper) => {
      if (!matchesText(paper, lowerTerm)) return false;
      if (instituteFilters.selectedYear !== "all" && String(paper.year) !== String(instituteFilters.selectedYear)) return false;
      if (instituteFilters.selectedQRating !== "all" && paper.qRating !== instituteFilters.selectedQRating) return false;
      if (instituteFilters.selectedPublicationType !== "all" && paper.publicationType !== instituteFilters.selectedPublicationType) return false;
      if (instituteFilters.selectedSubjectArea !== "all" && paper.subjectArea !== instituteFilters.selectedSubjectArea) return false;
      if (instituteFilters.selectedSubjectCategory !== "all" && !(paper.subjectCategories || []).includes(instituteFilters.selectedSubjectCategory)) return false;
      if (instituteFilters.selectedAuthor !== "all" && paper.claimedBy !== instituteFilters.selectedAuthor) return false;
      if (instituteFilters.selectedDepartment !== "all") {
        const dep = facultyDeptMap.get(paper.facultyId);
        if (dep !== instituteFilters.selectedDepartment) return false;
      }
      return true;
    });
  }, [
    institutePapers,
    selectedFacultyId,
    instituteFilters,
    facultyDeptMap,
  ]);

  // Filtered my papers
  const filteredMyPapers = useMemo(() => {
    const lowerTerm = (debouncedMyText || "").trim().toLowerCase();
    return myPapers.filter((paper) => {
      if (!matchesText(paper, lowerTerm)) return false;
      if (myFilters.selectedYear !== "all" && String(paper.year) !== String(myFilters.selectedYear)) return false;
      if (myFilters.selectedQRating !== "all" && paper.qRating !== myFilters.selectedQRating) return false;
      if (myFilters.selectedPublicationType !== "all" && paper.publicationType !== myFilters.selectedPublicationType) return false;
      if (myFilters.selectedSubjectArea !== "all" && paper.subjectArea !== myFilters.selectedSubjectArea) return false;
      if (myFilters.selectedSubjectCategory !== "all" && !(paper.subjectCategories || []).includes(myFilters.selectedSubjectCategory)) return false;
      return true;
    });
  }, [
    myPapers,
    debouncedMyText,
    myFilters,
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

  // Selections
  const handleInstituteSelectAll = useCallback(() => {
    if (instituteSelectAll) {
      setInstituteSelectedPapers(new Set());
      setInstituteSelectAll(false);
      toast.info("Deselected all", { duration: 1500 });
    } else {
      const ids = new Set(filteredInstitutePapers.map((p) => p._id));
      setInstituteSelectedPapers(ids);
      setInstituteSelectAll(ids.size === filteredInstitutePapers.length && ids.size > 0);
      toast.success(`Selected ${ids.size} visible`, { duration: 1500 });
    }
  }, [instituteSelectAll, filteredInstitutePapers, toast]);

  const handleInstituteSelect = useCallback(
    (id) => {
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
    setInstituteFilters({
      searchTerm: "",
      selectedYear: "all",
      selectedQRating: "all",
      selectedPublicationType: "all",
      selectedSubjectArea: "all",
      selectedSubjectCategory: "all",
      selectedAuthor: "all",
      selectedDepartment: "all",
    });
    toast.info("Cleared institute filters", { duration: 1500 });
  };
  const clearMyFilters = () => {
    setMyFilters({
      searchTerm: "",
      selectedYear: "all",
      selectedQRating: "all",
      selectedPublicationType: "all",
      selectedSubjectArea: "all",
      selectedSubjectCategory: "all",
    });
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
      await axios.delete(`${API_BASE_URL}/api/papers/${id}`, { headers: { Authorization: `Bearer ${token}` } });

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
          axios.delete(`${API_BASE_URL}/api/papers/${id}`, { headers: { Authorization: `Bearer ${token}` } })
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
          axios.delete(`${API_BASE_URL}/api/papers/${id}`, { headers: { Authorization: `Bearer ${token}` } })
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
      await axios.put(`${API_BASE_URL}/api/papers/${editingId}`, editData, {
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

  // --- Decoupled UserFinderSidebar: Compute usersWithPubCount based on publication filter ---
  const usersWithPubCount = useMemo(() => {
    // For each user matching the *user sidebar* filter, show their publication count for *current pub filters*
    return users.map((user) => {
      const pubCount = filteredInstitutePapers.filter((pub) => pub.facultyId === user.facultyId).length;
      return { ...user, pubCount };
    });
  }, [users, filteredInstitutePapers]);

  // UserFinderSidebar: Filter users with only user filters, not pub filters
  const userFinderSidebarUsers = useMemo(() => {
    // Only filter users by userFinderFilters (not publication filter)
    const term = userFinderFilters.searchTerm.trim().toLowerCase();
    let filtered = users;
    if (userFinderFilters.deptFilter !== "all") {
      filtered = filtered.filter((u) => u.department === userFinderFilters.deptFilter);
    }
    if (term) {
      filtered = filtered.filter((u) =>
        (u.fullName || "").toLowerCase().includes(term) ||
        (u.email || "").toLowerCase().includes(term) ||
        (u.facultyId || "").toLowerCase().includes(term)
      );
    }
    // Add pubCount from usersWithPubCount (guaranteed to match user.facultyId)
    return filtered.map(u => {
      const full = usersWithPubCount.find(uu => uu.facultyId === u.facultyId);
      return { ...u, pubCount: full ? full.pubCount : 0 };
    });
  }, [users, userFinderFilters, usersWithPubCount]);

  const onSelectFaculty = (faculty) => {
    setSelectedFacultyId(faculty?.facultyId ?? null);
    setActiveTab("institute");
    setExpanded(null);
    setInstituteSelectedPapers(new Set());
    setInstituteSelectAll(false);
    setFacultyFinderOpen(false);
  };

  if (loading) {
    return <PageLoader fullScreen={true} />;
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
          role="campus-admin"
        />

        {/* Faculty Finder Sidebar Drawer */}
        <UserFinderSidebar
          open={facultyFinderOpen}
          onClose={() => setFacultyFinderOpen(false)}
          users={userFinderSidebarUsers}
          papers={filteredInstitutePapers}
          selectedUserId={selectedFacultyId}
          onSelectUser={onSelectFaculty}
          searchTerm={userFinderFilters.searchTerm}
          onSearchTermChange={v => setUserFinderFilters(f => ({ ...f, searchTerm: v }))}
          deptFilter={userFinderFilters.deptFilter}
          onDeptFilterChange={v => setUserFinderFilters(f => ({ ...f, deptFilter: v }))}
          context="campus"
          campusCollege={currentUser?.college}
          campusInstitute={currentUser?.institute}
          loading={loading}
          title="Find Faculty"
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
                  <CampusAnalyticsCard
                    stats={{
                      ...campusStats,
                      subjectCategoryDistribution: (() => {
                        // Compute: { [subjectArea]: { [category]: count } }
                        const map = {};
                        for (const paper of institutePapers) {
                          if (!paper.subjectArea || !Array.isArray(paper.subjectCategories)) continue;
                          if (!map[paper.subjectArea]) map[paper.subjectArea] = {};
                          for (const cat of paper.subjectCategories) {
                            map[paper.subjectArea][cat] = (map[paper.subjectArea][cat] || 0) + 1;
                          }
                        }
                        return map;
                      })(),
                    }}
                    loading={loading}
                  />
                </div>
              </main>
            </div>
          </section>
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

        {/* Publication Type Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            {PUB_TABS.map((tab) => {
              const Icon = tab.icon;
              const count = activeTab === "institute"
                ? (tab.id === "papers" ? institutePapers.length :
                  tab.id === "bookChapters" ? instituteBookChapters.length :
                    instituteConference.length)
                : (tab.id === "papers" ? myPapers.length :
                  tab.id === "bookChapters" ? myBookChapters.length :
                    myConference.length);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePublicationType(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${activePublicationType === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${activePublicationType === tab.id ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Show Book Chapters or Conference Papers when their tab is active */}
        {activePublicationType === "bookChapters" && (
          <BookChaptersTable
            chapters={activeTab === "institute" ? instituteBookChapters : myBookChapters}
            selectedChapters={selectedChapters}
            selectAll={selectAllChapters}
            onToggleSelectAll={() => {
              const chapters = activeTab === "institute" ? instituteBookChapters : myBookChapters;
              if (selectAllChapters) {
                setSelectedChapters(new Set());
                setSelectAllChapters(false);
              } else {
                setSelectedChapters(new Set(chapters.map((c) => c._id)));
                setSelectAllChapters(true);
              }
            }}
            onToggleSelect={(id) => {
              const next = new Set(selectedChapters);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              setSelectedChapters(next);
            }}
            expandedIndex={expandedChapter}
            onToggleExpand={(i) => setExpandedChapter(expandedChapter === i ? null : i)}
            onEdit={(chapter) => { setEditingChapter(chapter); setEditChapterOpen(true); }}
            onDelete={async (id) => {
              setDeletingChapterId(id);
              try {
                const token = localStorage.getItem("token");
                await axios.delete(`${API_BASE_URL}/api/book-chapters/${id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                setInstituteBookChapters((prev) => prev.filter((c) => c._id !== id));
                setMyBookChapters((prev) => prev.filter((c) => c._id !== id));
                toast.success("Book chapter deleted", { duration: 2000 });
              } catch { toast.error("Delete failed"); }
              finally { setDeletingChapterId(null); }
            }}
            deletingId={deletingChapterId}
            hasActiveFilters={false}
            onClearFilters={() => { }}
          />
        )}

        {activePublicationType === "conferencePapers" && (
          <ConferencePapersTable
            papers={activeTab === "institute" ? instituteConference : myConference}
            selectedPapers={selectedConference}
            selectAll={selectAllConference}
            onToggleSelectAll={() => {
              const papers = activeTab === "institute" ? instituteConference : myConference;
              if (selectAllConference) {
                setSelectedConference(new Set());
                setSelectAllConference(false);
              } else {
                setSelectedConference(new Set(papers.map((p) => p._id)));
                setSelectAllConference(true);
              }
            }}
            onToggleSelect={(id) => {
              const next = new Set(selectedConference);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              setSelectedConference(next);
            }}
            expandedIndex={expandedConference}
            onToggleExpand={(i) => setExpandedConference(expandedConference === i ? null : i)}
            onEdit={(paper) => { setEditingConference(paper); setEditConferenceOpen(true); }}
            onDelete={async (id) => {
              setDeletingConferenceId(id);
              try {
                const token = localStorage.getItem("token");
                await axios.delete(`${API_BASE_URL}/api/conference-papers/${id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                setInstituteConference((prev) => prev.filter((p) => p._id !== id));
                setMyConference((prev) => prev.filter((p) => p._id !== id));
                toast.success("Conference paper deleted", { duration: 2000 });
              } catch { toast.error("Delete failed"); }
              finally { setDeletingConferenceId(null); }
            }}
            deletingId={deletingConferenceId}
            hasActiveFilters={false}
            onClearFilters={() => { }}
          />
        )}

        {activePublicationType === "papers" && (
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
                      searchTerm={instituteFilters.searchTerm}
                      selectedYear={instituteFilters.selectedYear}
                      selectedQRating={instituteFilters.selectedQRating}
                      selectedPublicationType={instituteFilters.selectedPublicationType}
                      selectedSubjectArea={instituteFilters.selectedSubjectArea}
                      selectedSubjectCategory={instituteFilters.selectedSubjectCategory}
                      selectedAuthor={"all"}
                      selectedDepartment={"all"}
                      onSearchTermChange={v => setInstituteFilters(f => ({ ...f, searchTerm: v }))}
                      onYearChange={v => setInstituteFilters(f => ({ ...f, selectedYear: v }))}
                      onQRatingChange={v => setInstituteFilters(f => ({ ...f, selectedQRating: v }))}
                      onPublicationTypeChange={v => setInstituteFilters(f => ({ ...f, selectedPublicationType: v }))}
                      onSubjectAreaChange={v => setInstituteFilters(f => ({ ...f, selectedSubjectArea: v }))}
                      onSubjectCategoryChange={v => setInstituteFilters(f => ({ ...f, selectedSubjectCategory: v }))}
                      onAuthorChange={() => { }}
                      onDepartmentChange={() => { }}
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
                      searchTerm={instituteFilters.searchTerm}
                      selectedYear={instituteFilters.selectedYear}
                      selectedQRating={instituteFilters.selectedQRating}
                      selectedPublicationType={instituteFilters.selectedPublicationType}
                      selectedSubjectArea={instituteFilters.selectedSubjectArea}
                      selectedSubjectCategory={instituteFilters.selectedSubjectCategory}
                      selectedAuthor={instituteFilters.selectedAuthor}
                      selectedDepartment={instituteFilters.selectedDepartment}
                      onSearchTermChange={v => setInstituteFilters(f => ({ ...f, searchTerm: v }))}
                      onYearChange={v => setInstituteFilters(f => ({ ...f, selectedYear: v }))}
                      onQRatingChange={v => setInstituteFilters(f => ({ ...f, selectedQRating: v }))}
                      onPublicationTypeChange={v => setInstituteFilters(f => ({ ...f, selectedPublicationType: v }))}
                      onSubjectAreaChange={v => setInstituteFilters(f => ({ ...f, selectedSubjectArea: v }))}
                      onSubjectCategoryChange={v => setInstituteFilters(f => ({ ...f, selectedSubjectCategory: v }))}
                      onAuthorChange={v => setInstituteFilters(f => ({ ...f, selectedAuthor: v }))}
                      onDepartmentChange={v => setInstituteFilters(f => ({ ...f, selectedDepartment: v }))}
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
                      isSuperAdmin={false}
                      userRole="campus_admin"
                      currentUser={currentUser}
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
                searchTerm={myFilters.searchTerm}
                selectedYear={myFilters.selectedYear}
                selectedQRating={myFilters.selectedQRating}
                selectedPublicationType={myFilters.selectedPublicationType}
                selectedSubjectArea={myFilters.selectedSubjectArea}
                selectedSubjectCategory={myFilters.selectedSubjectCategory}
                onSearchTermChange={v => setMyFilters(f => ({ ...f, searchTerm: v }))}
                onYearChange={v => setMyFilters(f => ({ ...f, selectedYear: v }))}
                onQRatingChange={v => setMyFilters(f => ({ ...f, selectedQRating: v }))}
                onPublicationTypeChange={v => setMyFilters(f => ({ ...f, selectedPublicationType: v }))}
                onSubjectAreaChange={v => setMyFilters(f => ({ ...f, selectedSubjectArea: v }))}
                onSubjectCategoryChange={v => setMyFilters(f => ({ ...f, selectedSubjectCategory: v }))}
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
                isSuperAdmin={false}
                userRole="campus_admin"
                currentUser={currentUser}
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
        )}
      </div>

      {/* Edit Dialogs */}

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

      <EditBookChapterDialog
        open={editChapterOpen}
        onOpenChange={setEditChapterOpen}
        chapter={editingChapter}
        onSave={async (data) => {
          try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_BASE_URL}/api/book-chapters/${data._id}`, data, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setInstituteBookChapters((prev) => prev.map((c) => (c._id === data._id ? { ...c, ...data } : c)));
            setMyBookChapters((prev) => prev.map((c) => (c._id === data._id ? { ...c, ...data } : c)));
            setEditChapterOpen(false);
            setEditingChapter(null);
            toast.success("Book chapter updated", { duration: 2200 });
          } catch (e) {
            toast.error(e.response?.data?.error || "Update failed", { duration: 3000 });
          }
        }}
        isSubmitting={false}
      />

      <EditConferencePaperDialog
        open={editConferenceOpen}
        onOpenChange={setEditConferenceOpen}
        paper={editingConference}
        onSave={async (data) => {
          try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_BASE_URL}/api/conference-papers/${data._id}`, data, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setInstituteConference((prev) => prev.map((p) => (p._id === data._id ? { ...p, ...data } : p)));
            setMyConference((prev) => prev.map((p) => (p._id === data._id ? { ...p, ...data } : p)));
            setEditConferenceOpen(false);
            setEditingConference(null);
            toast.success("Conference paper updated", { duration: 2200 });
          } catch (e) {
            toast.error(e.response?.data?.error || "Update failed", { duration: 3000 });
          }
        }}
        isSubmitting={false}
      />
    </div>
  );
};

export default CampusAdminDashboard;