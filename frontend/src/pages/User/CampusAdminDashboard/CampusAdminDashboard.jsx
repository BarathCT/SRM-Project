import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import PublicationTabs from "../components/PublicationTabs";
import PublicationTableSection from "../components/PublicationTableSection";
import PublicationEditDialogs from "../components/PublicationEditDialogs";
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

const CampusAdminDashboard = () => {
  const navigate = useNavigate();
  const [institutePapers, setInstitutePapers] = useState([]);
  const [myPapers, setMyPapers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("institute");

  // Pagination state for institute data
  const [institutePapersPagination, setInstitutePapersPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });
  const [instituteChaptersPagination, setInstituteChaptersPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });
  const [instituteConferencePagination, setInstituteConferencePagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });
  const [myPapersPagination, setMyPapersPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });
  const [myChaptersPagination, setMyChaptersPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });
  const [myConferencePagination, setMyConferencePagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });

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
        setLoading(false);
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
      // Error loading - UI shows loading state, no need for toast
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutePapers = async (user) => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch ALL pages to get complete data
      let allPapers = [];
      let currentPage = 1;
      let hasMore = true;
      let totalCount = 0;
      
      while (hasMore) {
        const response = await api.get('/papers/institute', {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            college: user.college, 
            institute: user.institute, 
            page: currentPage, 
            limit: 100 // Fetch 100 per page
          },
        });
        const result = response.data;
        if (result.pagination) {
          allPapers.push(...(result.data || []));
          totalCount = result.pagination.total || 0;
          const totalPages = result.pagination.totalPages || 1;
          hasMore = currentPage < totalPages;
          currentPage++;
        } else {
          allPapers.push(...(result || []));
          totalCount = Array.isArray(result) ? result.length : 0;
          hasMore = false;
        }
      }
      
      const sortedPapers = allPapers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInstitutePapers(sortedPapers);
      // Use actual array length for total to ensure accuracy
      const actualTotal = sortedPapers.length > 0 ? sortedPapers.length : totalCount;
      setInstitutePapersPagination({
        page: 1,
        limit: 15,
        total: actualTotal,
        totalPages: Math.ceil(actualTotal / 15),
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch (error) {
      console.error("Fetch institute papers error:", error);
      setInstitutePapers([]);
    }
  };

  const fetchMyPapers = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch ALL pages to get complete data
      let allPapers = [];
      let currentPage = 1;
      let hasMore = true;
      let totalCount = 0;
      
      while (hasMore) {
        const response = await api.get('/papers/my', {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            page: currentPage, 
            limit: 100 // Fetch 100 per page
          },
        });
        const result = response.data;
        if (result.pagination) {
          allPapers.push(...(result.data || []));
          totalCount = result.pagination.total || 0;
          const totalPages = result.pagination.totalPages || 1;
          hasMore = currentPage < totalPages;
          currentPage++;
        } else {
          allPapers.push(...(result || []));
          totalCount = Array.isArray(result) ? result.length : 0;
          hasMore = false;
        }
      }
      
      const sortedPapers = allPapers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMyPapers(sortedPapers);
      // Use actual array length for total to ensure accuracy
      const actualTotal = sortedPapers.length > 0 ? sortedPapers.length : totalCount;
      setMyPapersPagination({
        page: 1,
        limit: 15,
        total: actualTotal,
        totalPages: Math.ceil(actualTotal / 15),
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch (error) {
      console.error("Fetch my papers error:", error);
      setMyPapers([]);
    }
  };

  const fetchInstituteBookChapters = async (user) => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch ALL pages to get complete data
      let allChapters = [];
      let currentPage = 1;
      let hasMore = true;
      let totalCount = 0;
      
      while (hasMore) {
        const response = await api.get('/book-chapters/institute', {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            college: user.college, 
            institute: user.institute, 
            page: currentPage, 
            limit: 100 // Fetch 100 per page
          },
        });
        const result = response.data;
        if (result.pagination) {
          allChapters.push(...(result.data || []));
          totalCount = result.pagination.total || 0;
          const totalPages = result.pagination.totalPages || 1;
          hasMore = currentPage < totalPages;
          currentPage++;
        } else {
          allChapters.push(...(result || []));
          totalCount = Array.isArray(result) ? result.length : 0;
          hasMore = false;
        }
      }
      
      const sortedChapters = allChapters.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInstituteBookChapters(sortedChapters);
      // Use actual array length for total to ensure accuracy
      const actualTotal = sortedChapters.length > 0 ? sortedChapters.length : totalCount;
      setInstituteChaptersPagination({
        page: 1,
        limit: 15,
        total: actualTotal,
        totalPages: Math.ceil(actualTotal / 15),
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch {
      setInstituteBookChapters([]);
    }
  };

  const fetchMyBookChapters = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch ALL pages to get complete data
      let allChapters = [];
      let currentPage = 1;
      let hasMore = true;
      let totalCount = 0;
      
      while (hasMore) {
        const response = await api.get('/book-chapters/my', {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            page: currentPage, 
            limit: 100 // Fetch 100 per page
          },
        });
        const result = response.data;
        if (result.pagination) {
          allChapters.push(...(result.data || []));
          totalCount = result.pagination.total || 0;
          const totalPages = result.pagination.totalPages || 1;
          hasMore = currentPage < totalPages;
          currentPage++;
        } else {
          allChapters.push(...(result || []));
          totalCount = Array.isArray(result) ? result.length : 0;
          hasMore = false;
        }
      }
      
      const sortedChapters = allChapters.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMyBookChapters(sortedChapters);
      // Use actual array length for total to ensure accuracy
      const actualTotal = sortedChapters.length > 0 ? sortedChapters.length : totalCount;
      setMyChaptersPagination({
        page: 1,
        limit: 15,
        total: actualTotal,
        totalPages: Math.ceil(actualTotal / 15),
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch {
      setMyBookChapters([]);
    }
  };

  const fetchInstituteConference = async (user) => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch ALL pages to get complete data
      let allConference = [];
      let currentPage = 1;
      let hasMore = true;
      let totalCount = 0;
      
      while (hasMore) {
        const response = await api.get('/conference-papers/institute', {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            college: user.college, 
            institute: user.institute, 
            page: currentPage, 
            limit: 100 // Fetch 100 per page
          },
        });
        const result = response.data;
        if (result.pagination) {
          allConference.push(...(result.data || []));
          totalCount = result.pagination.total || 0;
          const totalPages = result.pagination.totalPages || 1;
          hasMore = currentPage < totalPages;
          currentPage++;
        } else {
          allConference.push(...(result || []));
          totalCount = Array.isArray(result) ? result.length : 0;
          hasMore = false;
        }
      }
      
      const sortedConference = allConference.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInstituteConference(sortedConference);
      // Use actual array length for total to ensure accuracy
      const actualTotal = sortedConference.length > 0 ? sortedConference.length : totalCount;
      setInstituteConferencePagination({
        page: 1,
        limit: 15,
        total: actualTotal,
        totalPages: Math.ceil(actualTotal / 15),
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch {
      setInstituteConference([]);
    }
  };

  const fetchMyConference = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch ALL pages to get complete data
      let allConference = [];
      let currentPage = 1;
      let hasMore = true;
      let totalCount = 0;
      
      while (hasMore) {
        const response = await api.get('/conference-papers/my', {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            page: currentPage, 
            limit: 100 // Fetch 100 per page
          },
        });
        const result = response.data;
        if (result.pagination) {
          allConference.push(...(result.data || []));
          totalCount = result.pagination.total || 0;
          const totalPages = result.pagination.totalPages || 1;
          hasMore = currentPage < totalPages;
          currentPage++;
        } else {
          allConference.push(...(result || []));
          totalCount = Array.isArray(result) ? result.length : 0;
          hasMore = false;
        }
      }
      
      const sortedConference = allConference.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMyConference(sortedConference);
      // Use actual array length for total to ensure accuracy
      const actualTotal = sortedConference.length > 0 ? sortedConference.length : totalCount;
      setMyConferencePagination({
        page: 1,
        limit: 15,
        total: actualTotal,
        totalPages: Math.ceil(actualTotal / 15),
        hasNextPage: false,
        hasPrevPage: false
      });
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
      // Handle paginated response for users
      const result = response.data;
      if (result.pagination) {
        setUsers(result.data || []);
      } else {
        setUsers(result || []);
      }
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
    const safeInstitutePapers = Array.isArray(institutePapers) ? institutePapers : [];
    const safeUsers = Array.isArray(users) ? users : [];
    const years = [...new Set(safeInstitutePapers.map((p) => Number(p.year)).filter(Boolean))].sort((a, b) => b - a);
    const qRatings = [...new Set(safeInstitutePapers.map((p) => p.qRating).filter(Boolean))].sort();
    const publicationTypes = [...new Set(safeInstitutePapers.map((p) => p.publicationType).filter(Boolean))].sort();
    const subjectAreas = [...new Set(safeInstitutePapers.map((p) => p.subjectArea).filter(Boolean))].sort();
    const authors = [...new Set(safeInstitutePapers.map((p) => p.claimedBy).filter(Boolean))].sort();
    const departments = [...new Set(safeUsers.map((u) => u.department).filter(Boolean))].sort();
    return { years, qRatings, publicationTypes, subjectAreas, authors, departments };
  }, [institutePapers, users]);

  // Filter options for my
  const myFilterOptions = useMemo(() => {
    const safeMyPapers = Array.isArray(myPapers) ? myPapers : [];
    const years = [...new Set(safeMyPapers.map((p) => Number(p.year)).filter(Boolean))].sort((a, b) => b - a);
    const qRatings = [...new Set(safeMyPapers.map((p) => p.qRating).filter(Boolean))].sort();
    const publicationTypes = [...new Set(safeMyPapers.map((p) => p.publicationType).filter(Boolean))].sort();
    const subjectAreas = [...new Set(safeMyPapers.map((p) => p.subjectArea).filter(Boolean))].sort();
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
    const safeInstitutePapers = Array.isArray(institutePapers) ? institutePapers : [];
    const lowerTerm = (instituteFilters.searchTerm || "").trim().toLowerCase();
    const scope = selectedFacultyId
      ? safeInstitutePapers.filter((p) => p.facultyId === selectedFacultyId)
      : safeInstitutePapers;

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
    const safeMyPapers = Array.isArray(myPapers) ? myPapers : [];
    const lowerTerm = (debouncedMyText || "").trim().toLowerCase();
    return safeMyPapers.filter((paper) => {
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
  const selectedFaculty = useMemo(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    return selectedFacultyId ? safeUsers.find((u) => u.facultyId === selectedFacultyId) || null : null;
  }, [users, selectedFacultyId]);
  const selectedFacultyAllPapers = useMemo(() => {
    const safeInstitutePapers = Array.isArray(institutePapers) ? institutePapers : [];
    return selectedFacultyId ? safeInstitutePapers.filter((p) => p.facultyId === selectedFacultyId) : [];
  }, [institutePapers, selectedFacultyId]);

  // Stats
  // Dynamic stats based on activePublicationType
  const campusStats = useMemo(() => {
    let safeInstituteItems = [];
    let safeMyItems = [];
    let institutePagination = null;
    let myPagination = null;

    if (activePublicationType === "papers") {
      safeInstituteItems = Array.isArray(institutePapers) ? institutePapers : [];
      safeMyItems = Array.isArray(myPapers) ? myPapers : [];
      institutePagination = institutePapersPagination;
      myPagination = myPapersPagination;
    } else if (activePublicationType === "bookChapters") {
      safeInstituteItems = Array.isArray(instituteBookChapters) ? instituteBookChapters : [];
      safeMyItems = Array.isArray(myBookChapters) ? myBookChapters : [];
      institutePagination = instituteChaptersPagination;
      myPagination = myChaptersPagination;
    } else if (activePublicationType === "conferencePapers") {
      safeInstituteItems = Array.isArray(instituteConference) ? instituteConference : [];
      safeMyItems = Array.isArray(myConference) ? myConference : [];
      institutePagination = instituteConferencePagination;
      myPagination = myConferencePagination;
    }

    const safeUsers = Array.isArray(users) ? users : [];

    // Use pagination total if available, otherwise fall back to array length
    const totalPapers = institutePagination?.total ?? safeInstituteItems.length;
    const myTotalPapers = myPagination?.total ?? safeMyItems.length;
    const totalFaculty = safeUsers.length;
    const activeFaculty = safeUsers.filter((u) => safeInstituteItems.some((p) => p.facultyId === u.facultyId)).length;

    const qDistribution = safeInstituteItems.reduce((acc, paper) => {
      acc[paper.qRating] = (acc[paper.qRating] || 0) + 1;
      return acc;
    }, {});

    const myQDistribution = safeMyItems.reduce((acc, paper) => {
      acc[paper.qRating] = (acc[paper.qRating] || 0) + 1;
      return acc;
    }, {});

    const yearlyTrend = safeInstituteItems.reduce((acc, paper) => {
      acc[paper.year] = (acc[paper.year] || 0) + 1;
      return acc;
    }, {});

    const subjectDistribution = safeInstituteItems.reduce((acc, paper) => {
      acc[paper.subjectArea] = (acc[paper.subjectArea] || 0) + 1;
      return acc;
    }, {});

    const departmentStats = safeUsers.reduce((acc, user) => {
      const userPapers = safeInstituteItems.filter((p) => p.facultyId === user.facultyId);
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

    // Calculate Q1 count from pagination total if available, otherwise use distribution
    const q1Count = institutePagination?.total 
      ? Math.round((totalPapers * ((qDistribution || {}).Q1 || 0)) / Math.max(safeInstituteItems.length, 1))
      : ((qDistribution || {}).Q1 || 0);

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
  }, [activePublicationType, institutePapers, myPapers, instituteBookChapters, myBookChapters, instituteConference, myConference, users, institutePapersPagination, myPapersPagination, instituteChaptersPagination, myChaptersPagination, instituteConferencePagination, myConferencePagination]);

  const myStats = useMemo(() => {
    // Use pagination total if available, otherwise fall back to array length
    const total = myPapersPagination?.total ?? (Array.isArray(myPapers) ? myPapers.length : 0);
    return { total };
  }, [myPapers, myPapersPagination]);

  // Selections
  const handleInstituteSelectAll = useCallback(() => {
    if (instituteSelectAll) {
      setInstituteSelectedPapers(new Set());
      setInstituteSelectAll(false);
      // Deselected all - UI update is sufficient
    } else {
      const ids = new Set(filteredInstitutePapers.map((p) => p._id));
      setInstituteSelectedPapers(ids);
      setInstituteSelectAll(ids.size === filteredInstitutePapers.length && ids.size > 0);
      // Selection updated - UI shows the change
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
      // Deselected all - UI update is sufficient
    } else {
      const ids = new Set(filteredMyPapers.map((p) => p._id));
      setMySelectedPapers(ids);
      setMySelectAll(ids.size === filteredMyPapers.length);
      // Selection updated - UI shows the change
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
    // Filters cleared - UI update is sufficient
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
    // Filters cleared - UI update is sufficient
  };
  const clearInstituteSelection = () => {
    setInstituteSelectedPapers(new Set());
    setInstituteSelectAll(false);
    // Selection cleared - UI update is sufficient
  };
  const clearMySelection = () => {
    setMySelectedPapers(new Set());
    setMySelectAll(false);
    // Selection cleared - UI update is sufficient
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
      toast.error(errorMessage);
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
      toast.success("Deleted selected publications");
    } catch {
      toast.error("Some deletions failed");
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
      toast.success("Deleted selected publications");
    } catch {
      toast.error("Some deletions failed");
    }
  };

  // Edit
  const startEdit = (paper) => {
    if (!canEditPaper(paper)) {
      toast.warning("You can only edit your own publications");
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
    // Validation - errors should be shown in form UI, not toasts
    if (!editData.title?.trim() || !editData.journal?.trim() || !editData.publisher?.trim() || !Number(editData.year) || !PUBLICATION_TYPES.includes(editData.publicationType) || !Object.keys(SUBJECT_AREAS).includes(editData.subjectArea)) {
      toast.error("Please fill in all required fields correctly");
      return;
    }
    const validCats = SUBJECT_AREAS[editData.subjectArea] || [];
    if (!editData.subjectCategories?.length || !editData.subjectCategories.every((c) => validCats.includes(c))) {
      toast.error("Please select valid subject categories");
      return;
    }

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
      toast.success("Publication updated");
    } catch (e) {
      const errorMessage = e.response?.data?.error || "Update failed";
      toast.error(errorMessage);
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

    if (!data.length) {
      toast.warning("No publications to export");
      return;
    }

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
    toast.success(`Exported ${data.length} publication${data.length !== 1 ? 's' : ''}`, { duration: 3000 });
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
    return <PageLoader message="Loading Campus Admin Dashboard..." fullScreen={true} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <DashboardHeader
          title="Campus Admin Dashboard"
          subtitle={`${currentUser?.college} - ${currentUser?.institute} Publications Management`}
          userName={currentUser?.fullName}
          icon={null}
          showTabSwitch={currentUser?.role === "campus_admin"}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onShowAnalytics={() => {
            // Determine which items to use based on activePublicationType
            let itemsToUse = [];
            if (activePublicationType === "papers") {
              itemsToUse = institutePapers;
            } else if (activePublicationType === "bookChapters") {
              itemsToUse = instituteBookChapters;
            } else if (activePublicationType === "conferencePapers") {
              itemsToUse = instituteConference;
            }
            
            const statsData = {
              ...campusStats,
              subjectCategoryDistribution: (() => {
                // Compute: { [subjectArea]: { [category]: count } }
                const map = {};
                for (const item of itemsToUse) {
                  if (!item.subjectArea || !Array.isArray(item.subjectCategories)) continue;
                  if (!map[item.subjectArea]) map[item.subjectArea] = {};
                  for (const cat of item.subjectCategories) {
                    map[item.subjectArea][cat] = (map[item.subjectArea][cat] || 0) + 1;
                  }
                }
                return map;
              })(),
            };
            navigate('/campus-admin/analytics', { state: { stats: statsData, loading } });
          }}
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
            <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
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
                value={(() => {
                  // Use pagination total to calculate Q1 count accurately
                  let totalItems = 0;
                  let currentQ1Count = (campusStats.qDistribution || {}).Q1 || 0;
                  let currentPageCount = 0;
                  
                  if (activePublicationType === "papers") {
                    totalItems = institutePapersPagination?.total ?? 0;
                    currentPageCount = institutePapers.length || 1;
                  } else if (activePublicationType === "bookChapters") {
                    totalItems = instituteChaptersPagination?.total ?? 0;
                    currentPageCount = instituteBookChapters.length || 1;
                  } else if (activePublicationType === "conferencePapers") {
                    totalItems = instituteConferencePagination?.total ?? 0;
                    currentPageCount = instituteConference.length || 1;
                  }
                  
                  // Estimate Q1 count based on current page ratio
                  return totalItems > 0 && currentPageCount > 0
                    ? Math.round((totalItems * currentQ1Count) / currentPageCount)
                    : currentQ1Count;
                })()}
                subtitle={`${campusStats.q1Percentage}% of total`}
                icon={<Award className="h-8 w-8 text-blue-600" />}
                loading={loading}
              />
            </div>
          )
        )}

        {/* Publication Type Tab Navigation */}
        <PublicationTabs
          activeTab={activePublicationType}
          onTabChange={setActivePublicationType}
          counts={{
            papers: activeTab === "institute"
              ? (institutePapersPagination?.total ?? institutePapers.length)
              : (myPapersPagination?.total ?? myPapers.length),
            bookChapters: activeTab === "institute"
              ? (instituteChaptersPagination?.total ?? instituteBookChapters.length)
              : (myChaptersPagination?.total ?? myBookChapters.length),
            conferencePapers: activeTab === "institute"
              ? (instituteConferencePagination?.total ?? instituteConference.length)
              : (myConferencePagination?.total ?? myConference.length),
          }}
        />

        {/* Show Book Chapters or Conference Papers when their tab is active */}
        {(activePublicationType === "bookChapters" || activePublicationType === "conferencePapers") && (
          <PublicationTableSection
            activeTab={activePublicationType}
            // Chapters props
            chapters={activeTab === "institute" ? instituteBookChapters : myBookChapters}
            selectedChapters={selectedChapters}
            selectAllChapters={selectAllChapters}
            onToggleSelectAllChapters={() => {
              const chapters = activeTab === "institute" ? instituteBookChapters : myBookChapters;
              if (selectAllChapters) {
                setSelectedChapters(new Set());
                setSelectAllChapters(false);
              } else {
                setSelectedChapters(new Set(chapters.map((c) => c._id)));
                setSelectAllChapters(true);
              }
            }}
            onToggleSelectChapter={(id) => {
              const next = new Set(selectedChapters);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              setSelectedChapters(next);
            }}
            expandedChapter={expandedChapter}
            onToggleExpandChapter={(i) => setExpandedChapter(expandedChapter === i ? null : i)}
            onEditChapter={(chapter) => { setEditingChapter(chapter); setEditChapterOpen(true); }}
            onDeleteChapter={async (id) => {
              setDeletingChapterId(id);
              try {
                const token = localStorage.getItem("token");
                await axios.delete(`${API_BASE_URL}/api/book-chapters/${id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                setInstituteBookChapters((prev) => prev.filter((c) => c._id !== id));
                setMyBookChapters((prev) => prev.filter((c) => c._id !== id));
                toast.success("Book chapter deleted");
              } catch { toast.error("Delete failed"); }
              finally { setDeletingChapterId(null); }
            }}
            deletingChapterId={deletingChapterId}
            chaptersPagination={activeTab === "institute" ? instituteChaptersPagination : myChaptersPagination}
            onChaptersPageChange={() => {}} // Handled internally by table component
            onChaptersLimitChange={() => {}} // Handled internally by table component
            loadingChapters={loading}
            // Conference props
            conference={activeTab === "institute" ? instituteConference : myConference}
            selectedConference={selectedConference}
            selectAllConference={selectAllConference}
            onToggleSelectAllConference={() => {
              const papers = activeTab === "institute" ? instituteConference : myConference;
              if (selectAllConference) {
                setSelectedConference(new Set());
                setSelectAllConference(false);
              } else {
                setSelectedConference(new Set(papers.map((p) => p._id)));
                setSelectAllConference(true);
              }
            }}
            onToggleSelectConference={(id) => {
              const next = new Set(selectedConference);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              setSelectedConference(next);
            }}
            expandedConference={expandedConference}
            onToggleExpandConference={(i) => setExpandedConference(expandedConference === i ? null : i)}
            onEditConference={(paper) => { setEditingConference(paper); setEditConferenceOpen(true); }}
            onDeleteConference={async (id) => {
              setDeletingConferenceId(id);
              try {
                const token = localStorage.getItem("token");
                await axios.delete(`${API_BASE_URL}/api/conference-papers/${id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                setInstituteConference((prev) => prev.filter((p) => p._id !== id));
                setMyConference((prev) => prev.filter((p) => p._id !== id));
                toast.success("Conference paper deleted");
              } catch { toast.error("Delete failed"); }
              finally { setDeletingConferenceId(null); }
            }}
            deletingConferenceId={deletingConferenceId}
            conferencePagination={activeTab === "institute" ? instituteConferencePagination : myConferencePagination}
            onConferencePageChange={() => {}} // Handled internally by table component
            onConferenceLimitChange={() => {}} // Handled internally by table component
            loadingConference={loading}
            // Common props
            hasActiveFilters={false}
            onClearFilters={() => { }}
            filteredCount={
              activePublicationType === "bookChapters"
                ? (activeTab === "institute" ? instituteBookChapters.length : myBookChapters.length)
                : (activeTab === "institute" ? instituteConference.length : myConference.length)
            }
            totalCount={
              activePublicationType === "bookChapters"
                ? (activeTab === "institute" ? instituteChaptersPagination.total : myChaptersPagination.total)
                : (activeTab === "institute" ? instituteConferencePagination.total : myConferencePagination.total)
            }
            selectedCount={
              activePublicationType === "bookChapters" ? selectedChapters.size : selectedConference.size
            }
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
      <PublicationEditDialogs
        editPaperOpen={editDialogOpen}
        onEditPaperOpenChange={setEditDialogOpen}
        editingPaper={editData}
        onUpdatePaper={updatePaper}
        isUpdatingPaper={false}
        editChapterOpen={editChapterOpen}
        onEditChapterOpenChange={setEditChapterOpen}
        editingChapter={editingChapter}
        onUpdateChapter={async (data) => {
          try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_BASE_URL}/api/book-chapters/${data._id}`, data, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setInstituteBookChapters((prev) => prev.map((c) => (c._id === data._id ? { ...c, ...data } : c)));
            setMyBookChapters((prev) => prev.map((c) => (c._id === data._id ? { ...c, ...data } : c)));
            setEditChapterOpen(false);
            setEditingChapter(null);
            toast.success("Book chapter updated");
          } catch (e) {
            toast.error(e.response?.data?.error || "Update failed");
          }
        }}
        isUpdatingChapter={false}
        editConferenceOpen={editConferenceOpen}
        onEditConferenceOpenChange={setEditConferenceOpen}
        editingConference={editingConference}
        onUpdateConference={async (data) => {
          try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_BASE_URL}/api/conference-papers/${data._id}`, data, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setInstituteConference((prev) => prev.map((p) => (p._id === data._id ? { ...p, ...data } : p)));
            setMyConference((prev) => prev.map((p) => (p._id === data._id ? { ...p, ...data } : p)));
            setEditConferenceOpen(false);
            setEditingConference(null);
            toast.success("Conference paper updated");
          } catch (e) {
            toast.error(e.response?.data?.error || "Update failed");
          }
        }}
        isUpdatingConference={false}
      />
    </div>
  );
};

export default CampusAdminDashboard;