import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useToast } from "@/components/Toast";
import { BookOpen, Presentation, FileText } from "lucide-react";
import { PageLoader } from "@/components/ui/loading";

// Components
import DashboardHeader from "../components/DashboardHeader";
import PublicationsFilterCard from "../components/PublicationsFilterCard";
import PublicationsTable from "../components/PublicationTable/PublicationsTable";
import BookChaptersTable from "../components/PublicationTable/BookChaptersTable";
import ConferencePapersTable from "../components/PublicationTable/ConferencePapersTable";
import EditPublicationDialog from "../components/PublicationTable/EditPublicationDialog";
import EditBookChapterDialog from "../components/PublicationTable/EditBookChapterDialog";
import EditConferencePaperDialog from "../components/PublicationTable/EditConferencePaperDialog";
import StatsCard from "../components/StatsCard";

import { SUBJECT_AREAS } from "@/utils/subjectAreas";

import api from '@/lib/api';


const PUBLICATION_TYPES = ["scopus", "sci", "webOfScience"];
const Q_RATINGS = ["Q1", "Q2", "Q3", "Q4"];
const TABS = [
  { id: "papers", label: "Research Papers", icon: FileText },
  { id: "bookChapters", label: "Book Chapters", icon: BookOpen },
  { id: "conferencePapers", label: "Conference Papers", icon: Presentation },
];

const FacultyDashboard = () => {
  const [activeTab, setActiveTab] = useState("papers");

  // Research Papers State
  const [papers, setPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [selectedPapers, setSelectedPapers] = useState(new Set());
  const [selectAllPapers, setSelectAllPapers] = useState(false);
  const [expandedPaper, setExpandedPaper] = useState(null);
  const [deletingPaperId, setDeletingPaperId] = useState(null);

  // Book Chapters State
  const [bookChapters, setBookChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [selectedChapters, setSelectedChapters] = useState(new Set());
  const [selectAllChapters, setSelectAllChapters] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [deletingChapterId, setDeletingChapterId] = useState(null);

  // Conference Papers State
  const [conferencePapers, setConferencePapers] = useState([]);
  const [loadingConference, setLoadingConference] = useState(true);
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
      const response = await api.get('/papers/my', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 } // Fetch all for client-side filtering (temporary)
      });
      // Handle both paginated and non-paginated responses
      const data = response.data?.data || response.data || [];
      setPapers(Array.isArray(data) ? data : []);
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
      const response = await api.get('/book-chapters/my', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      });
      const data = response.data?.data || response.data || [];
      setBookChapters(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch book chapters:", e);
      setBookChapters([]);
    } finally {
      setLoadingChapters(false);
    }
  };

  const fetchConferencePapers = async () => {
    try {
      setLoadingConference(true);
      const token = localStorage.getItem("token");
      const response = await api.get('/conference-papers/my', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      });
      const data = response.data?.data || response.data || [];
      setConferencePapers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch conference papers:", e);
      setConferencePapers([]);
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
    const years = [...new Set(data.map((p) => p.year))].sort((a, b) => b - a);
    const qRatings = activeTab === "papers" ? [...new Set(papers.map((p) => p.qRating))].sort() : [];
    const publicationTypes = activeTab === "papers" ? [...new Set(papers.map((p) => p.publicationType))].sort() : [];
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
    return papers.filter((paper) => {
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
    return bookChapters.filter((chapter) => {
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
    return conferencePapers.filter((paper) => {
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
  const stats = useMemo(() => ({
    papers: papers.length,
    chapters: bookChapters.length,
    conference: conferencePapers.length,
  }), [papers.length, bookChapters.length, conferencePapers.length]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Research Papers"
          value={stats.papers}
          subtitle="Journal publications"
          icon={<FileText className="h-8 w-8 text-blue-600" />}
          loading={loadingPapers}
        />
        <StatsCard
          title="Book Chapters"
          value={stats.chapters}
          subtitle="Book contributions"
          icon={<BookOpen className="h-8 w-8 text-green-600" />}
          loading={loadingChapters}
        />
        <StatsCard
          title="Conference Papers"
          value={stats.conference}
          subtitle="Conference presentations"
          icon={<Presentation className="h-8 w-8 text-purple-600" />}
          loading={loadingConference}
        />
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

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

      {/* Content based on active tab */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-700 flex items-center gap-2">
          {activeTab === "papers" && <FileText className="h-4 w-4 text-blue-600" />}
          {activeTab === "bookChapters" && <BookOpen className="h-4 w-4 text-green-600" />}
          {activeTab === "conferencePapers" && <Presentation className="h-4 w-4 text-purple-600" />}
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {activeTab === "papers" ? filteredPapers.length :
              activeTab === "bookChapters" ? filteredChapters.length : filteredConference.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-900">
            {activeTab === "papers" ? papers.length :
              activeTab === "bookChapters" ? bookChapters.length : conferencePapers.length}
          </span>
          {getSelectedCount() > 0 && (
            <span className="text-blue-600">
              {" "}• <span className="font-semibold">{getSelectedCount()}</span> selected
            </span>
          )}
        </p>
      </div>

      {/* Tables */}
      {activeTab === "papers" && (
        <PublicationsTable
          papers={filteredPapers}
          selectedPapers={selectedPapers}
          selectAll={selectAllPapers}
          onToggleSelectAll={handleSelectAllPapers}
          onToggleSelect={handleSelectPaper}
          expandedIndex={expandedPaper}
          onToggleExpand={(i) => setExpandedPaper(expandedPaper === i ? null : i)}
          onEdit={startEditPaper}
          onDelete={deletePaper}
          deletingId={deletingPaperId}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      )}

      {activeTab === "bookChapters" && (
        <BookChaptersTable
          chapters={filteredChapters}
          selectedChapters={selectedChapters}
          selectAll={selectAllChapters}
          onToggleSelectAll={handleSelectAllChapters}
          onToggleSelect={handleSelectChapter}
          expandedIndex={expandedChapter}
          onToggleExpand={(i) => setExpandedChapter(expandedChapter === i ? null : i)}
          onEdit={startEditChapter}
          onDelete={deleteChapter}
          deletingId={deletingChapterId}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      )}

      {activeTab === "conferencePapers" && (
        <ConferencePapersTable
          papers={filteredConference}
          selectedPapers={selectedConference}
          selectAll={selectAllConference}
          onToggleSelectAll={handleSelectAllConference}
          onToggleSelect={handleSelectConference}
          expandedIndex={expandedConference}
          onToggleExpand={(i) => setExpandedConference(expandedConference === i ? null : i)}
          onEdit={startEditConference}
          onDelete={deleteConferencePaper}
          deletingId={deletingConferenceId}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Edit Dialogs */}
      <EditPublicationDialog
        open={editPaperOpen}
        onOpenChange={setEditPaperOpen}
        value={editingPaper}
        onChange={setEditingPaper}
        onSubmit={() => updatePaper(editingPaper)}
        onCancel={() => setEditPaperOpen(false)}
        isSubmitting={isUpdating}
        subjectAreas={SUBJECT_AREAS}
        publicationTypes={PUBLICATION_TYPES}
        qRatings={Q_RATINGS}
      />

      <EditBookChapterDialog
        open={editChapterOpen}
        onOpenChange={setEditChapterOpen}
        chapter={editingChapter}
        onSave={updateChapter}
        isSubmitting={isUpdating}
      />

      <EditConferencePaperDialog
        open={editConferenceOpen}
        onOpenChange={setEditConferenceOpen}
        paper={editingConference}
        onSave={updateConferencePaper}
        isSubmitting={isUpdating}
      />
    </div>
  );
};

export default FacultyDashboard;