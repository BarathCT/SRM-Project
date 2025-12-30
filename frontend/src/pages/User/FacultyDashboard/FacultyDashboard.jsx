import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useToast } from "@/components/Toast";
import { PageLoader } from "@/components/ui/loading";
import { useDebounce } from "@/hooks/useDebounce";

// Components
import DashboardHeader from "../components/DashboardHeader";
import PublicationsFilterCard from "../components/PublicationsFilterCard";
import PublicationTabs from "../components/PublicationTabs";
import PublicationTableSection from "../components/PublicationTableSection";
import PublicationEditDialogs from "../components/PublicationEditDialogs";
import PublicationStatsCards from "../components/PublicationStatsCards";

import { SUBJECT_AREAS } from "@/utils/subjectAreas";

import api from '@/lib/api';

const FacultyDashboard = () => {
  const [activeTab, setActiveTab] = useState("papers");

  // Research Papers State
  const [papers, setPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [papersPagination, setPapersPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });
  const [selectedPapers, setSelectedPapers] = useState(new Set());
  const [selectAllPapers, setSelectAllPapers] = useState(false);
  const [expandedPaper, setExpandedPaper] = useState(null);
  const [deletingPaperId, setDeletingPaperId] = useState(null);

  // Book Chapters State
  const [bookChapters, setBookChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [chaptersPagination, setChaptersPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });
  const [selectedChapters, setSelectedChapters] = useState(new Set());
  const [selectAllChapters, setSelectAllChapters] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [deletingChapterId, setDeletingChapterId] = useState(null);

  // Conference Papers State
  const [conferencePapers, setConferencePapers] = useState([]);
  const [loadingConference, setLoadingConference] = useState(true);
  const [conferencePagination, setConferencePagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });
  const [selectedConference, setSelectedConference] = useState(new Set());
  const [selectAllConference, setSelectAllConference] = useState(false);
  const [expandedConference, setExpandedConference] = useState(null);
  const [deletingConferenceId, setDeletingConferenceId] = useState(null);

  // Common Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedQRating, setSelectedQRating] = useState("all");
  const [selectedPublicationType, setSelectedPublicationType] = useState("all");
  const [selectedSubjectArea, setSelectedSubjectArea] = useState("all");

  // Edit dialogs
  const [editPaperOpen, setEditPaperOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);
  const [editChapterOpen, setEditChapterOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [editConferenceOpen, setEditConferenceOpen] = useState(false);
  const [editingConference, setEditingConference] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Export
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
    volume: false,
    issue: false,
    pageNo: false,
    publicationId: false,
    claimedBy: false,
    authorNo: false,
    isStudentScholar: false,
    studentScholars: false,
    typeOfIssue: false,
  });

  const { toast } = useToast();

  // Debounced search for server-side filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch all data on mount
  useEffect(() => {
    fetchPapers();
    fetchBookChapters();
    fetchConferencePapers();
  }, []);

  const fetchPapers = async () => {
    try {
      setLoadingPapers(true);
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
          }
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
      setPapers(sortedPapers);
      // Use actual array length for total to ensure accuracy
      const actualTotal = sortedPapers.length > 0 ? sortedPapers.length : totalCount;
      setPapersPagination({
        page: 1,
        limit: 15,
        total: actualTotal,
        totalPages: Math.ceil(actualTotal / 15),
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch (e) {
      console.error("Failed to fetch research papers:", e);
      setPapers([]);
    } finally {
      setLoadingPapers(false);
    }
  };

  const fetchBookChapters = async () => {
    try {
      setLoadingChapters(true);
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
          }
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
      
      setBookChapters(allChapters);
      // Use actual array length for total to ensure accuracy
      const actualTotal = allChapters.length > 0 ? allChapters.length : totalCount;
      setChaptersPagination({
        page: 1,
        limit: 15,
        total: actualTotal,
        totalPages: Math.ceil(actualTotal / 15),
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch (e) {
      console.error("Failed to fetch book chapters:", e);
    } finally {
      setLoadingChapters(false);
    }
  };

  const fetchConferencePapers = async () => {
    try {
      setLoadingConference(true);
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
          }
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
      
      setConferencePapers(allConference);
      // Use actual array length for total to ensure accuracy
      const actualTotal = allConference.length > 0 ? allConference.length : totalCount;
      setConferencePagination({
        page: 1,
        limit: 15,
        total: actualTotal,
        totalPages: Math.ceil(actualTotal / 15),
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch (e) {
      console.error("Failed to fetch conference papers:", e);
    } finally {
      setLoadingConference(false);
    }
  };

  const isLoading = activeTab === "papers" ? loadingPapers :
    activeTab === "bookChapters" ? loadingChapters : loadingConference;

  // Filter options based on active tab
  const filterOptions = useMemo(() => {
    const data = activeTab === "papers" ? papers :
      activeTab === "bookChapters" ? bookChapters : conferencePapers;
    // Guard against non-array data
    const safeData = Array.isArray(data) ? data : [];
    const safePapers = Array.isArray(papers) ? papers : [];
    const years = [...new Set(safeData.map((p) => p.year))].sort((a, b) => b - a);
    const qRatings = activeTab === "papers" ? [...new Set(safePapers.map((p) => p.qRating))].sort() : [];
    const publicationTypes = activeTab === "papers" ? [...new Set(safePapers.map((p) => p.publicationType))].sort() : [];
    const subjectAreas = Object.keys(SUBJECT_AREAS);
    return { years, qRatings, publicationTypes, subjectAreas };
  }, [activeTab, papers, bookChapters, conferencePapers]);

  const hasActiveFilters = useMemo(
    () =>
      searchTerm !== "" ||
      selectedYear !== "all" ||
      selectedQRating !== "all" ||
      selectedPublicationType !== "all" ||
      selectedSubjectArea !== "all",
    [searchTerm, selectedYear, selectedQRating, selectedPublicationType, selectedSubjectArea]
  );

  // Filtered data for active tab
  const filteredPapers = useMemo(() => {
    const safePapers = Array.isArray(papers) ? papers : [];
    return safePapers.filter((paper) => {
      const matchesSearch =
        searchTerm === "" ||
        paper.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.journal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.authors?.some((a) => a.name?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesYear = selectedYear === "all" || String(paper.year) === selectedYear;
      const matchesQ = selectedQRating === "all" || paper.qRating === selectedQRating;
      const matchesType = selectedPublicationType === "all" || paper.publicationType === selectedPublicationType;
      const matchesArea = selectedSubjectArea === "all" || paper.subjectArea === selectedSubjectArea;
      return matchesSearch && matchesYear && matchesQ && matchesType && matchesArea;
    });
  }, [papers, searchTerm, selectedYear, selectedQRating, selectedPublicationType, selectedSubjectArea]);

  const filteredChapters = useMemo(() => {
    const safeChapters = Array.isArray(bookChapters) ? bookChapters : [];
    return safeChapters.filter((chapter) => {
      const matchesSearch =
        searchTerm === "" ||
        chapter.chapterTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chapter.bookTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chapter.authors?.some((a) => a.name?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesYear = selectedYear === "all" || String(chapter.year) === selectedYear;
      const matchesArea = selectedSubjectArea === "all" || chapter.subjectArea === selectedSubjectArea;
      return matchesSearch && matchesYear && matchesArea;
    });
  }, [bookChapters, searchTerm, selectedYear, selectedSubjectArea]);

  const filteredConference = useMemo(() => {
    const safeConference = Array.isArray(conferencePapers) ? conferencePapers : [];
    return safeConference.filter((paper) => {
      const matchesSearch =
        searchTerm === "" ||
        paper.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.conferenceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.authors?.some((a) => a.name?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesYear = selectedYear === "all" || String(paper.year) === selectedYear;
      const matchesArea = selectedSubjectArea === "all" || paper.subjectArea === selectedSubjectArea;
      return matchesSearch && matchesYear && matchesArea;
    });
  }, [conferencePapers, searchTerm, selectedYear, selectedSubjectArea]);

  // Stats
  const stats = useMemo(() => {
    // Use pagination total if available, otherwise fall back to array length
    const papersCount = papersPagination?.total ?? (Array.isArray(papers) ? papers.length : 0);
    const chaptersCount = chaptersPagination?.total ?? (Array.isArray(bookChapters) ? bookChapters.length : 0);
    const conferenceCount = conferencePagination?.total ?? (Array.isArray(conferencePapers) ? conferencePapers.length : 0);
    return {
      papers: papersCount,
      chapters: chaptersCount,
      conference: conferenceCount,
    };
  }, [papers, bookChapters, conferencePapers, papersPagination, chaptersPagination, conferencePagination]);

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedYear("all");
    setSelectedQRating("all");
    setSelectedPublicationType("all");
    setSelectedSubjectArea("all");
    // Filters cleared - UI update is sufficient
  };

  // Selection handlers for papers
  const handleSelectAllPapers = useCallback(() => {
    if (selectAllPapers) {
      setSelectedPapers(new Set());
      setSelectAllPapers(false);
    } else {
      setSelectedPapers(new Set(filteredPapers.map((p) => p._id)));
      setSelectAllPapers(true);
    }
  }, [selectAllPapers, filteredPapers]);

  const handleSelectPaper = useCallback((id) => {
    const next = new Set(selectedPapers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPapers(next);
    setSelectAllPapers(next.size === filteredPapers.length);
  }, [selectedPapers, filteredPapers.length]);

  // Selection handlers for chapters
  const handleSelectAllChapters = useCallback(() => {
    if (selectAllChapters) {
      setSelectedChapters(new Set());
      setSelectAllChapters(false);
    } else {
      setSelectedChapters(new Set(filteredChapters.map((c) => c._id)));
      setSelectAllChapters(true);
    }
  }, [selectAllChapters, filteredChapters]);

  const handleSelectChapter = useCallback((id) => {
    const next = new Set(selectedChapters);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedChapters(next);
    setSelectAllChapters(next.size === filteredChapters.length);
  }, [selectedChapters, filteredChapters.length]);

  // Selection handlers for conference papers
  const handleSelectAllConference = useCallback(() => {
    if (selectAllConference) {
      setSelectedConference(new Set());
      setSelectAllConference(false);
    } else {
      setSelectedConference(new Set(filteredConference.map((p) => p._id)));
      setSelectAllConference(true);
    }
  }, [selectAllConference, filteredConference]);

  const handleSelectConference = useCallback((id) => {
    const next = new Set(selectedConference);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedConference(next);
    setSelectAllConference(next.size === filteredConference.length);
  }, [selectedConference, filteredConference.length]);

  // Delete handlers
  const deletePaper = async (id) => {
    setDeletingPaperId(id);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/papers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPapers((prev) => prev.filter((p) => p._id !== id));
      setSelectedPapers((prev) => { const next = new Set(prev); next.delete(id); return next; });
      toast.success("Publication deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingPaperId(null);
    }
  };

  const deleteChapter = async (id) => {
    setDeletingChapterId(id);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/book-chapters/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookChapters((prev) => prev.filter((c) => c._id !== id));
      setSelectedChapters((prev) => { const next = new Set(prev); next.delete(id); return next; });
      toast.success("Book chapter deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingChapterId(null);
    }
  };

  const deleteConferencePaper = async (id) => {
    setDeletingConferenceId(id);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/conference-papers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConferencePapers((prev) => prev.filter((p) => p._id !== id));
      setSelectedConference((prev) => { const next = new Set(prev); next.delete(id); return next; });
      toast.success("Conference paper deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingConferenceId(null);
    }
  };

  // Edit handlers
  const startEditPaper = (paper) => {
    setEditingPaper({
      ...paper,
      subjectCategories: paper.subjectCategories || [],
    });
    setEditPaperOpen(true);
  };

  const updatePaper = async (data) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/api/papers/${data._id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPapers((prev) => prev.map((p) => (p._id === data._id ? { ...p, ...data } : p)));
      setEditPaperOpen(false);
      setEditingPaper(null);
      toast.success("Publication updated");
    } catch (e) {
      toast.error(e.response?.data?.error || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditChapter = (chapter) => {
    setEditingChapter(chapter);
    setEditChapterOpen(true);
  };

  const updateChapter = async (data) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/api/book-chapters/${data._id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookChapters((prev) => prev.map((c) => (c._id === data._id ? { ...c, ...data } : c)));
      setEditChapterOpen(false);
      setEditingChapter(null);
      toast.success("Book chapter updated");
    } catch (e) {
      toast.error(e.response?.data?.error || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditConference = (paper) => {
    setEditingConference(paper);
    setEditConferenceOpen(true);
  };

  const updateConferencePaper = async (data) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/api/conference-papers/${data._id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConferencePapers((prev) => prev.map((p) => (p._id === data._id ? { ...p, ...data } : p)));
      setEditConferenceOpen(false);
      setEditingConference(null);
      toast.success("Conference paper updated");
    } catch (e) {
      toast.error(e.response?.data?.error || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  // Bulk delete
  const bulkDelete = async () => {
    const selected = activeTab === "papers" ? selectedPapers :
      activeTab === "bookChapters" ? selectedChapters : selectedConference;
    if (!selected.size) return;

    const endpoint = activeTab === "papers" ? "papers" :
      activeTab === "bookChapters" ? "book-chapters" : "conference-papers";

    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        Array.from(selected).map((id) =>
          axios.delete(`${API_BASE_URL}/api/${endpoint}/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      if (activeTab === "papers") {
        setPapers((prev) => prev.filter((p) => !selected.has(p._id)));
        setSelectedPapers(new Set());
        setSelectAllPapers(false);
      } else if (activeTab === "bookChapters") {
        setBookChapters((prev) => prev.filter((c) => !selected.has(c._id)));
        setSelectedChapters(new Set());
        setSelectAllChapters(false);
      } else {
        setConferencePapers((prev) => prev.filter((p) => !selected.has(p._id)));
        setSelectedConference(new Set());
        setSelectAllConference(false);
      }

      toast.success("Deleted selected items", { duration: 2200 });
    } catch {
      toast.error("Some deletions failed");
    }
  };

  const clearSelection = () => {
    if (activeTab === "papers") {
      setSelectedPapers(new Set());
      setSelectAllPapers(false);
    } else if (activeTab === "bookChapters") {
      setSelectedChapters(new Set());
      setSelectAllChapters(false);
    } else {
      setSelectedConference(new Set());
      setSelectAllConference(false);
    }
    // Selection cleared - UI update is sufficient
  };

  const getSelectedCount = () => {
    if (activeTab === "papers") return selectedPapers.size;
    if (activeTab === "bookChapters") return selectedChapters.size;
    return selectedConference.size;
  };

  const handleRefresh = () => {
    if (activeTab === "papers") fetchPapers();
    else if (activeTab === "bookChapters") fetchBookChapters();
    else fetchConferencePapers();
  };

  if (isLoading) {
    return <PageLoader fullScreen={true} message="Loading Publications..." />;
  }

  return (
    <div className="min-h-screen bg-white px-2 sm:px-4 lg:px-6 py-6">
      <DashboardHeader
        title="Publications Dashboard"
        subtitle="Manage and track your research publications"
        showRefresh
        refreshing={isLoading}
        onRefresh={handleRefresh}
        role="faculty"
        icon={null}
      />

      {/* Stats Cards */}
      <PublicationStatsCards
        stats={stats}
        loading={{
          papers: loadingPapers,
          chapters: loadingChapters,
          conference: loadingConference,
        }}
      />

      {/* Tab Navigation */}
      <PublicationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{
          papers: stats.papers,
          bookChapters: stats.chapters,
          conferencePapers: stats.conference,
        }}
      />

      {/* Filters */}
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
        selectedCount={getSelectedCount()}
        onClearSelection={clearSelection}
        onBulkDelete={bulkDelete}
        exportDialogOpen={exportDialogOpen}
        onExportDialogOpenChange={setExportDialogOpen}
        exportFields={exportFields}
        onExportFieldsChange={setExportFields}
        onExport={() => { }}
      />

      {/* Tables with Pagination */}
      <PublicationTableSection
        activeTab={activeTab}
        // Papers props
        papers={filteredPapers}
        selectedPapers={selectedPapers}
        selectAllPapers={selectAllPapers}
        onToggleSelectAllPapers={handleSelectAllPapers}
        onToggleSelectPaper={handleSelectPaper}
        expandedPaper={expandedPaper}
        onToggleExpandPaper={(i) => setExpandedPaper(expandedPaper === i ? null : i)}
        onEditPaper={startEditPaper}
        onDeletePaper={deletePaper}
        deletingPaperId={deletingPaperId}
        papersPagination={papersPagination}
        onPapersPageChange={() => {}} // Handled internally by table component
        onPapersLimitChange={() => {}} // Handled internally by table component
        loadingPapers={loadingPapers}
        // Chapters props
        chapters={filteredChapters}
        selectedChapters={selectedChapters}
        selectAllChapters={selectAllChapters}
        onToggleSelectAllChapters={handleSelectAllChapters}
        onToggleSelectChapter={handleSelectChapter}
        expandedChapter={expandedChapter}
        onToggleExpandChapter={(i) => setExpandedChapter(expandedChapter === i ? null : i)}
        onEditChapter={startEditChapter}
        onDeleteChapter={deleteChapter}
        deletingChapterId={deletingChapterId}
        chaptersPagination={chaptersPagination}
        onChaptersPageChange={() => {}} // Handled internally by table component
        onChaptersLimitChange={() => {}} // Handled internally by table component
        loadingChapters={loadingChapters}
        // Conference props
        conference={filteredConference}
        selectedConference={selectedConference}
        selectAllConference={selectAllConference}
        onToggleSelectAllConference={handleSelectAllConference}
        onToggleSelectConference={handleSelectConference}
        expandedConference={expandedConference}
        onToggleExpandConference={(i) => setExpandedConference(expandedConference === i ? null : i)}
        onEditConference={startEditConference}
        onDeleteConference={deleteConferencePaper}
        deletingConferenceId={deletingConferenceId}
        conferencePagination={conferencePagination}
        onConferencePageChange={() => {}} // Handled internally by table component
        onConferenceLimitChange={() => {}} // Handled internally by table component
        loadingConference={loadingConference}
        // Common props
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filteredCount={
          activeTab === "papers" ? filteredPapers.length :
          activeTab === "bookChapters" ? filteredChapters.length : filteredConference.length
        }
        totalCount={
          activeTab === "papers" ? (papers.length > 0 ? papers.length : papersPagination.total) :
          activeTab === "bookChapters" ? (bookChapters.length > 0 ? bookChapters.length : chaptersPagination.total) : 
          (conferencePapers.length > 0 ? conferencePapers.length : conferencePagination.total)
        }
        selectedCount={getSelectedCount()}
      />

      {/* Edit Dialogs */}
      <PublicationEditDialogs
        editPaperOpen={editPaperOpen}
        onEditPaperOpenChange={setEditPaperOpen}
        editingPaper={editingPaper}
        onUpdatePaper={updatePaper}
        isUpdatingPaper={isUpdating}
        subjectAreas={SUBJECT_AREAS}
        editChapterOpen={editChapterOpen}
        onEditChapterOpenChange={setEditChapterOpen}
        editingChapter={editingChapter}
        onUpdateChapter={updateChapter}
        isUpdatingChapter={isUpdating}
        editConferenceOpen={editConferenceOpen}
        onEditConferenceOpenChange={setEditConferenceOpen}
        editingConference={editingConference}
        onUpdateConference={updateConferencePaper}
        isUpdatingConference={isUpdating}
      />
    </div>
  );
};

export default FacultyDashboard;