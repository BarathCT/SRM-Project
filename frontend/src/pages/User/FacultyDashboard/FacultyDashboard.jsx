import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useToast } from "@/components/Toast";
import { BookOpen, RefreshCw } from "lucide-react";

// Components
import DashboardHeader from "../components/DashboardHeader";
import PublicationsFilterCard from "../components/PublicationsFilterCard";
import PublicationsTable from "../components/PublicationTable/PublicationsTable";
import EditPublicationDialog from "../components/PublicationTable/EditPublicationDialog";
import StatsCard from "../components/StatsCard";

// Import centralized subject areas (removed local duplicate)
import { SUBJECT_AREAS } from "@/utils/subjectAreas";

const PUBLICATION_TYPES = ["scopus", "sci", "webOfScience", "pubmed"];
const Q_RATINGS = ["Q1", "Q2", "Q3", "Q4"];

const FacultyDashboard = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expanded, setExpanded] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [selectedPapers, setSelectedPapers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedQRating, setSelectedQRating] = useState("all");
  const [selectedPublicationType, setSelectedPublicationType] = useState("all");
  const [selectedSubjectArea, setSelectedSubjectArea] = useState("all");

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);

  // Export dialog
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

  useEffect(() => {
    fetchPapers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/papers/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPapers(response.data || []);
      toast.academic(`Loaded ${response.data?.length || 0} publications`, { duration: 2500 });
    } catch (e) {
      toast.error("Failed to fetch publications. Please try again.", { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = useMemo(() => {
    const years = [...new Set(papers.map((p) => p.year))].sort((a, b) => b - a);
    const qRatings = [...new Set(papers.map((p) => p.qRating))].sort();
    const publicationTypes = [...new Set(papers.map((p) => p.publicationType))].sort();
    const subjectAreas = Object.keys(SUBJECT_AREAS); // Use centralized list to keep dropdown consistent
    return { years, qRatings, publicationTypes, subjectAreas };
  }, [papers]);

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
    return papers.filter((paper) => {
      const matchesSearch =
        searchTerm === "" ||
        paper.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.journal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.authors?.some((a) => a.name?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesYear = selectedYear === "all" || String(paper.year) === selectedYear;
      const matchesQ = selectedQRating === "all" || paper.qRating === selectedQRating;
      const matchesType =
        selectedPublicationType === "all" || paper.publicationType === selectedPublicationType;
      const matchesArea =
        selectedSubjectArea === "all" || paper.subjectArea === selectedSubjectArea;

      return matchesSearch && matchesYear && matchesQ && matchesType && matchesArea;
    });
  }, [
    papers,
    searchTerm,
    selectedYear,
    selectedQRating,
    selectedPublicationType,
    selectedSubjectArea,
  ]);

  const stats = useMemo(
    () => ({ total: papers.length, selected: selectedPapers.size }),
    [papers.length, selectedPapers.size]
  );

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

  const deletePaper = async (id) => {
    setDeletingId(id);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/papers/${id}`, {
        headers: { Authorization: { Authorization: `Bearer ${token}` } },
      });
      setPapers((prev) => prev.filter((p) => p._id !== id));
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

  const bulkDelete = async () => {
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
      setPapers((prev) => prev.filter((p) => !selectedPapers.has(p._id)));
      setSelectedPapers(new Set());
      setSelectAll(false);
      toast.success("Deleted selected publications", { duration: 2200 });
    } catch {
      toast.error("Some deletions failed", { duration: 2500 });
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
      subjectCategories:
        paper.subjectCategories?.length
          ? paper.subjectCategories
          : SUBJECT_AREAS["Computer Science"].slice(0, 1),
      publicationId: paper.publicationId || "",
      typeOfIssue: paper.typeOfIssue || "Regular Issue",
      claimedBy: paper.claimedBy || "",
      authorNo: paper.authorNo || "1",
      isStudentScholar: paper.isStudentScholar || "no",
      authors:
        paper.authors?.length
          ? paper.authors.map((a) => ({ name: a.name || "", isCorresponding: !!a.isCorresponding }))
          : [{ name: paper.claimedBy || "", isCorresponding: true }],
      studentScholars:
        paper.studentScholars?.length
          ? paper.studentScholars.map((s) =>
              typeof s === "string" ? { name: s, id: "" } : { name: s.name || "", id: s.id || "" }
            )
          : [],
    });
    setEditDialogOpen(true);
  };

  const updatePaper = async () => {
    if (!editData.title?.trim()) return toast.warning("Title is required");
    if (!editData.journal?.trim()) return toast.warning("Journal is required");
    if (!editData.publisher?.trim()) return toast.warning("Publisher is required");
    if (!Number(editData.year)) return toast.warning("Valid year is required");
    if (!PUBLICATION_TYPES.includes(editData.publicationType))
      return toast.warning("Invalid publication type");
    if (!Object.keys(SUBJECT_AREAS).includes(editData.subjectArea))
      return toast.warning("Invalid subject area");
    const validCats = SUBJECT_AREAS[editData.subjectArea] || [];
    if (
      !editData.subjectCategories?.length ||
      !editData.subjectCategories.every((c) => validCats.includes(c))
    )
      return toast.warning("Choose valid subject categories for the selected area");

    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/papers/${editingId}`, editData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setPapers((prev) => prev.map((p) => (p._id === editingId ? { ...p, ...editData } : p)));
      setEditDialogOpen(false);
      setEditingId(null);
      setEditData(null);
      toast.success("Publication updated", { duration: 2200 });
    } catch (e) {
      toast.error(e.response?.data?.error || "Update failed", { duration: 3000 });
    }
  };

  const exportSelectedData = () => {
    const data = selectedPapers.size
      ? papers.filter((p) => selectedPapers.has(p._id))
      : filteredPapers;
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
      volume: "Volume",
      issue: "Issue",
      pageNo: "Page Numbers",
      publicationId: "Publication ID",
      claimedBy: "Claimed By",
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
              return (p.studentScholars || [])
                .map((s) => (typeof s === "string" ? s : s.name))
                .join("; ");
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
    a.download = `publications_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDialogOpen(false);
    toast.academic(`Exported ${data.length} publications`, { duration: 2200 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center space-x-3 bg-white p-8 rounded-xl shadow-sm border border-blue-100">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Loading Publications</h3>
            <p className="text-gray-600">Please wait…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 lg:p-6 w-[75%] mx-auto">
      <DashboardHeader
        title="Publications Dashboard"
        subtitle="Manage and track your research publications"
        showRefresh
        refreshing={loading}
        onRefresh={fetchPapers}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Publications"
          value={stats.total}
          subtitle="All research papers"
          icon={<BookOpen className="h-8 w-8 text-blue-600" />}
          loading={loading}
        />
      </div>

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
        onBulkDelete={bulkDelete}
        exportDialogOpen={exportDialogOpen}
        onExportDialogOpenChange={setExportDialogOpen}
        exportFields={exportFields}
        onExportFieldsChange={setExportFields}
        onExport={exportSelectedData}
      />

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-700 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-600" />
          Showing <span className="font-semibold text-gray-900">{filteredPapers.length}</span> of{" "}
          <span className="font-semibold text-gray-900">{papers.length}</span>
          {selectedPapers.size > 0 && (
            <span className="text-blue-600">
              {" "}
              • <span className="font-semibold">{selectedPapers.size}</span> selected
            </span>
          )}
        </p>
      </div>

      <PublicationsTable
        papers={filteredPapers}
        selectedPapers={selectedPapers}
        selectAll={selectAll}
        onToggleSelectAll={handleSelectAll}
        onToggleSelect={handleSelect}
        expandedIndex={expanded}
        onToggleExpand={(i) => setExpanded(expanded === i ? null : i)}
        onEdit={startEdit}
        onDelete={deletePaper}
        deletingId={deletingId}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

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

export default FacultyDashboard;