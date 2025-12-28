import React from "react";
import { FileText, BookOpen, Presentation } from "lucide-react";
import PublicationsTable from "./PublicationTable/PublicationsTable";
import BookChaptersTable from "./PublicationTable/BookChaptersTable";
import ConferencePapersTable from "./PublicationTable/ConferencePapersTable";
import { Pagination } from "@/components/ui/pagination";

const ICONS = {
  papers: FileText,
  bookChapters: BookOpen,
  conferencePapers: Presentation,
};

const COLORS = {
  papers: "text-blue-600",
  bookChapters: "text-green-600",
  conferencePapers: "text-purple-600",
};

export default function PublicationTableSection({
  activeTab,
  // Papers props
  papers = [],
  selectedPapers = new Set(),
  selectAllPapers = false,
  onToggleSelectAllPapers,
  onToggleSelectPaper,
  expandedPaper,
  onToggleExpandPaper,
  onEditPaper,
  onDeletePaper,
  deletingPaperId,
  papersPagination,
  onPapersPageChange,
  onPapersLimitChange,
  loadingPapers = false,
  // Chapters props
  chapters = [],
  selectedChapters = new Set(),
  selectAllChapters = false,
  onToggleSelectAllChapters,
  onToggleSelectChapter,
  expandedChapter,
  onToggleExpandChapter,
  onEditChapter,
  onDeleteChapter,
  deletingChapterId,
  chaptersPagination,
  onChaptersPageChange,
  onChaptersLimitChange,
  loadingChapters = false,
  // Conference props
  conference = [],
  selectedConference = new Set(),
  selectAllConference = false,
  onToggleSelectAllConference,
  onToggleSelectConference,
  expandedConference,
  onToggleExpandConference,
  onEditConference,
  onDeleteConference,
  deletingConferenceId,
  conferencePagination,
  onConferencePageChange,
  onConferenceLimitChange,
  loadingConference = false,
  // Common props
  hasActiveFilters = false,
  onClearFilters,
  showAuthorInfo = false,
  users = [],
  currentUser,
  canEditPaper,
  canDeletePaper,
  onUpdatePaper,
  isUpdatingPaper = false,
  // Display props
  filteredCount = 0,
  totalCount = 0,
  selectedCount = 0,
}) {
  const Icon = ICONS[activeTab];
  const iconColor = COLORS[activeTab];

  const getDisplayData = () => {
    switch (activeTab) {
      case "papers":
        return {
          filtered: papers.length,
          total: papersPagination?.total || papers.length,
        };
      case "bookChapters":
        return {
          filtered: chapters.length,
          total: chaptersPagination?.total || chapters.length,
        };
      case "conferencePapers":
        return {
          filtered: conference.length,
          total: conferencePagination?.total || conference.length,
        };
      default:
        return { filtered: 0, total: 0 };
    }
  };

  const displayData = getDisplayData();
  const showing = filteredCount || displayData.filtered;
  const total = totalCount || displayData.total;

  return (
    <>
      {/* Content summary */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm text-gray-700 flex items-center gap-2 flex-wrap">
          {Icon && <Icon className={`h-4 w-4 ${iconColor} flex-shrink-0`} />}
          <span className="whitespace-nowrap">
            Showing <span className="font-semibold text-gray-900">{showing}</span> of{" "}
            <span className="font-semibold text-gray-900">{total}</span>
          </span>
          {selectedCount > 0 && (
            <span className="text-blue-600 whitespace-nowrap">
              {" "}• <span className="font-semibold">{selectedCount}</span> selected
            </span>
          )}
        </p>
      </div>

      {/* Tables with Pagination */}
      {activeTab === "papers" && (
        <>
          <PublicationsTable
            papers={papers}
            selectedPapers={selectedPapers}
            selectAll={selectAllPapers}
            onToggleSelectAll={onToggleSelectAllPapers}
            onToggleSelect={onToggleSelectPaper}
            expandedIndex={expandedPaper}
            onToggleExpand={onToggleExpandPaper}
            onEdit={onEditPaper}
            onDelete={onDeletePaper}
            deletingId={deletingPaperId}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
            showAuthorInfo={showAuthorInfo}
            users={users}
            currentUser={currentUser}
            canEditPaper={canEditPaper}
            canDeletePaper={canDeletePaper}
            onUpdatePaper={onUpdatePaper}
            isUpdatingPaper={isUpdatingPaper}
          />
          {papersPagination && (
            <Pagination
              page={papersPagination.page}
              totalPages={papersPagination.totalPages}
              total={papersPagination.total}
              limit={papersPagination.limit}
              hasNextPage={papersPagination.hasNextPage}
              hasPrevPage={papersPagination.hasPrevPage}
              onPageChange={onPapersPageChange}
              onLimitChange={onPapersLimitChange}
              loading={loadingPapers}
            />
          )}
        </>
      )}

      {activeTab === "bookChapters" && (
        <>
          <BookChaptersTable
            chapters={chapters}
            selectedChapters={selectedChapters}
            selectAll={selectAllChapters}
            onToggleSelectAll={onToggleSelectAllChapters}
            onToggleSelect={onToggleSelectChapter}
            expandedIndex={expandedChapter}
            onToggleExpand={onToggleExpandChapter}
            onEdit={onEditChapter}
            onDelete={onDeleteChapter}
            deletingId={deletingChapterId}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
          />
          {chaptersPagination && (
            <Pagination
              page={chaptersPagination.page}
              totalPages={chaptersPagination.totalPages}
              total={chaptersPagination.total}
              limit={chaptersPagination.limit}
              hasNextPage={chaptersPagination.hasNextPage}
              hasPrevPage={chaptersPagination.hasPrevPage}
              onPageChange={onChaptersPageChange}
              onLimitChange={onChaptersLimitChange}
              loading={loadingChapters}
            />
          )}
        </>
      )}

      {activeTab === "conferencePapers" && (
        <>
          <ConferencePapersTable
            papers={conference}
            selectedPapers={selectedConference}
            selectAll={selectAllConference}
            onToggleSelectAll={onToggleSelectAllConference}
            onToggleSelect={onToggleSelectConference}
            expandedIndex={expandedConference}
            onToggleExpand={onToggleExpandConference}
            onEdit={onEditConference}
            onDelete={onDeleteConference}
            deletingId={deletingConferenceId}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
          />
          {conferencePagination && (
            <Pagination
              page={conferencePagination.page}
              totalPages={conferencePagination.totalPages}
              total={conferencePagination.total}
              limit={conferencePagination.limit}
              hasNextPage={conferencePagination.hasNextPage}
              hasPrevPage={conferencePagination.hasPrevPage}
              onPageChange={onConferencePageChange}
              onLimitChange={onConferenceLimitChange}
              loading={loadingConference}
            />
          )}
        </>
      )}
    </>
  );
}

