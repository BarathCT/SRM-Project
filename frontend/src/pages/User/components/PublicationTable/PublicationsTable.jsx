import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Eye,
  EyeOff,
  MoreHorizontal,
  Trash2,
  Edit,
  X,
  Users,
  Building,
  Lock,
  User,
  Shield,
  ArrowLeft,
} from "lucide-react";
import Pagination from "@/components/Pagination";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

/**
 * PublicationsTable
 *
 * This version allows campus admin (showAuthorInfo=true) to select ANY publication (checkbox enabled for all).
 */
export default function PublicationsTable({
  papers,
  selectedPapers,
  selectAll,
  onToggleSelectAll,
  onToggleSelect,
  expandedIndex,
  onToggleExpand,
  onDelete,
  deletingId,
  hasActiveFilters,
  onClearFilters,
  showAuthorInfo = false,
  users = [],
  currentUser,
  canEditPaper,
  canDeletePaper,
  onUpdatePaper = () => {},
  isUpdatingPaper = false,
}) {
  const navigate = useNavigate();
  const noResults = papers.length === 0;

  // Pagination
  const PER_PAGE = 15;
  const [page, setPage] = useState(1);

  // Mobile/Tablet full-screen modal state
  const [selectedPaperForMobile, setSelectedPaperForMobile] = useState(null);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Long press state for mobile/tablet selection (use ref for timer to avoid closure issues)
  const longPressTimerRef = useRef(null);
  const [longPressTarget, setLongPressTarget] = useState(null);

  // Helper to determine publication type for routing
  const getPublicationTypeRoute = (publicationType) => {
    const typeMap = {
      'scopus': 'research',
      'sci': 'research',
      'webOfScience': 'research',
      'research': 'research',
      'conference': 'conference',
      'book-chapter': 'book-chapter',
    };
    return typeMap[publicationType] || 'research';
  };

  // Helper to get current user role for route prefix
  const getRoutePrefix = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user?.role;
    if (role === 'super_admin') return '/super-admin';
    if (role === 'campus_admin') return '/campus-admin';
    if (role === 'faculty') return '/faculty';
    return '/faculty'; // default
  };

  const openEditDialog = useCallback((paper) => {
    const type = getPublicationTypeRoute(paper.publicationType);
    const routePrefix = getRoutePrefix();
    navigate(`${routePrefix}/edit/${type}/${paper._id}`, {
      state: { publication: paper }
    });
  }, [navigate]);


  useEffect(() => {
    setPage(1);
  }, [papers]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(papers.length / PER_PAGE)),
    [papers.length]
  );

  const displayedPapers = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    const end = start + PER_PAGE;
    return papers.slice(start, end);
  }, [papers, page]);

  // Calculate permissions for mobile modal
  const mobileModalPermissions = useMemo(() => {
    if (!selectedPaperForMobile) return null;
    const isOwn = !!currentUser && selectedPaperForMobile.facultyId === currentUser.facultyId;
    const canEditPaperValue = !canEditPaper || canEditPaper(selectedPaperForMobile);
    const canDeletePaperValue = !canDeletePaper || canDeletePaper(selectedPaperForMobile);
    const showDropdownMenuValue = !showAuthorInfo || isOwn;
    return {
      isOwn,
      canEditPaperValue,
      canDeletePaperValue,
      showDropdownMenuValue,
    };
  }, [selectedPaperForMobile, canEditPaper, canDeletePaper, showAuthorInfo, currentUser?.facultyId]);

  // Helpers
  const getFacultyInfo = (facultyId) => {
    const faculty = users.find((u) => u.facultyId === facultyId);
    return (
      faculty || {
        fullName: "Unknown Faculty",
        department: "Unknown Department",
        email: "",
      }
    );
  };

  const isOwnPaper = (paper) =>
    !!currentUser && paper.facultyId === currentUser.facultyId;

  const getOwnershipBadge = (paper) => {
    if (!showAuthorInfo || !currentUser) return null;

    if (isOwnPaper(paper)) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 text-xs"
              >
                <User className="h-3 w-3 mr-1" />
                Your Paper
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is your publication</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge
              variant="outline"
              className="bg-gray-50 text-gray-600 border-gray-200 text-xs"
            >
              <Shield className="h-3 w-3 mr-1" />
              View Only
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>You can only view this publication</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };


  return (
    <>
      <Card className="border border-gray-200 bg-white">
        <CardHeader className="bg-white-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Publications
                {showAuthorInfo && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 ml-2"
                  >
                    <Building className="h-3 w-3 mr-1" />
                    Institute View
                  </Badge>
                )}
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {noResults ? (
            <div className="text-center py-16 bg-white">
              <BookOpen className="h-20 w-20 text-blue-200 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No publications found
              </h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters
                  ? "Try adjusting your filters or search query"
                  : showAuthorInfo
                  ? "No publications found in your institute"
                  : "You haven't uploaded any publications yet"}
              </p>
              {hasActiveFilters && (
                <Button
                  onClick={onClearFilters}
                  variant="outline"
                  className="border-blue-200 hover:border-blue-400"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full bg-white">
                  <thead className="bg-white-50 border-b border-blue-100 hidden md:table-header-group">
                    <tr>
                      <th className="py-4 px-4 text-left"></th>
                      <th className="py-4 px-4 text-left font-semibold text-gray-900">
                        Publication Details
                      </th>
                      {showAuthorInfo && (
                        <th className="py-4 px-4 text-left font-semibold text-gray-900 hidden lg:table-cell">
                          Faculty Info
                        </th>
                      )}
                      <th className="py-4 px-4 text-left font-semibold text-gray-900 hidden md:table-cell">
                        Journal
                      </th>
                      <th className="py-4 px-4 text-left font-semibold text-gray-900">
                        Metrics
                      </th>
                      <th className="py-4 px-4 text-left font-semibold text-gray-900 hidden lg:table-cell">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100">
                    {displayedPapers.map((paper, index) => {
                      const facultyInfo = showAuthorInfo
                        ? getFacultyInfo(paper.facultyId)
                        : null;
                      const isOwn = isOwnPaper(paper);
                      const canEdit =
                        !canEditPaper || canEditPaper(paper);
                      const canDelete =
                        !canDeletePaper || canDeletePaper(paper);

                      // Checkbox: campus admin can select any paper (restriction removed)
                      const isSelectable = true;

                      const showDropdownMenu = !showAuthorInfo || isOwn;
                      const isSelected = selectedPapers.has(paper._id);

                      // Long press handler for mobile/tablet selection
                      const handleTouchStart = (e) => {
                        if (window.innerWidth >= 1280) return; // Only on mobile/tablet (below xl breakpoint)
                        // Clear any existing timer
                        if (longPressTimerRef.current) {
                          clearTimeout(longPressTimerRef.current);
                        }
                        const timer = setTimeout(() => {
                          // Long press detected - toggle selection
                          onToggleSelect(paper._id);
                          setLongPressTarget(paper._id);
                          // Add haptic feedback if available
                          if (navigator.vibrate) {
                            navigator.vibrate(50);
                          }
                          longPressTimerRef.current = null;
                        }, 500); // 500ms for long press
                        longPressTimerRef.current = timer;
                      };

                      const handleTouchEnd = () => {
                        if (longPressTimerRef.current) {
                          clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = null;
                        }
                        // Reset target after a short delay
                        setTimeout(() => setLongPressTarget(null), 200);
                      };

                      const handleTouchCancel = () => {
                        if (longPressTimerRef.current) {
                          clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = null;
                        }
                        setLongPressTarget(null);
                      };

                      const handleRowClick = (e) => {
                        // Don't trigger click if it was a long press selection
                        if (longPressTarget === paper._id) {
                          return;
                        }
                        // On mobile/tablet, if selection mode is active (any row is selected), allow single click to select
                        if (window.innerWidth < 1280 && selectedPapers.size > 0) {
                          // If any row is selected, treat click as selection toggle
                          if (
                            !e.target.closest('input[type="checkbox"]') &&
                            !e.target.closest('button') &&
                            !e.target.closest('[role="button"]')
                          ) {
                            onToggleSelect(paper._id);
                            return;
                          }
                        }
                        // Only handle row click on mobile/tablet (below lg breakpoint)
                        // Prevent if clicking on checkbox or button
                        if (
                          e.target.closest('input[type="checkbox"]') ||
                          e.target.closest('button') ||
                          e.target.closest('[role="button"]')
                        ) {
                          return;
                        }
                        // Check if we're on mobile/tablet (window width < 1280px, i.e., below xl breakpoint)
                        if (window.innerWidth < 1280) {
                          setSelectedPaperForMobile(paper);
                          setIsMobileModalOpen(true);
                        }
                      };

                      return (
                        <React.Fragment key={paper._id}>
                          <tr
                            className={`transition-colors lg:cursor-default cursor-pointer ${
                              isSelected 
                                ? 'bg-blue-100 lg:bg-blue-50/60' 
                                : 'hover:bg-blue-50/60'
                            }`}
                            onClick={handleRowClick}
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                            onTouchCancel={handleTouchCancel}
                            style={{ userSelect: 'none' }}
                          >
                            <td className="py-3 px-2 md:py-4 md:px-4 hidden lg:table-cell">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => onToggleSelect(paper._id)}
                                className="border-blue-300"
                                disabled={false}
                              />
                            </td>
                            <td className="py-3 px-2 md:py-4 md:px-4 align-top">
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <h4 className="font-semibold text-gray-900 leading-tight flex-1 text-sm lg:text-base line-clamp-2">
                                    {paper.title}
                                  </h4>
                                  <span className="hidden lg:inline-block flex-shrink-0">
                                  {getOwnershipBadge(paper)}
                                  </span>
                                </div>
                                {/* Show authors only on desktop */}
                                <p className="text-sm text-gray-600 hidden lg:block">
                                  <span className="font-medium">Authors:</span>{" "}
                                  {paper.authors
                                    ?.slice(0, 3)
                                    .map((a) =>
                                      a.isCorresponding
                                        ? `${a.name} (C)`
                                        : a.name
                                    )
                                    .join(", ")}
                                  {paper.authors?.length > 3 && (
                                    <span className="text-blue-700">
                                      {" "}
                                      +{paper.authors.length - 3} more
                                    </span>
                                  )}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    {paper.publicationType}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    {paper.subjectArea}
                                  </Badge>
                                  {showAuthorInfo && paper.claimedBy && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                    >
                                      <Users className="h-3 w-3 mr-1" />
                                      {paper.claimedBy}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                            {showAuthorInfo && (
                              <td className="py-4 px-4 hidden lg:table-cell align-top">
                                <div className="space-y-1">
                                  <p className="font-medium text-gray-900 text-sm">
                                    {facultyInfo.fullName}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    <Building className="h-3 w-3 inline mr-1" />
                                    {facultyInfo.department}
                                  </p>
                                  <p className="text-xs text-gray-500 font-mono break-all">
                                    {paper.facultyId}
                                  </p>
                                  {isOwn && (
                                    <Badge
                                      variant="outline"
                                      className="bg-green-50 text-green-700 border-green-200 text-xs"
                                    >
                                      You
                                    </Badge>
                                  )}
                                </div>
                              </td>
                            )}
                            <td className="py-4 px-4 hidden md:table-cell align-top">
                              <p className="font-medium text-gray-900">
                                {paper.journal}
                              </p>
                              <p className="text-sm text-gray-600">
                                {paper.publisher}
                              </p>
                              <a
                                href={`https://doi.org/${paper.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 font-mono break-all hover:underline"
                              >
                                {paper.doi}
                              </a>
                            </td>
                            <td className="py-3 px-2 md:py-4 md:px-4 align-top">
                              <div className="flex flex-col sm:block space-y-1 sm:space-y-2">
                                <Badge
                                  variant="secondary"
                                  className="bg-gray-100 text-gray-800 font-medium w-fit"
                                >
                                  {paper.year}
                                </Badge>
                                <Badge
                                  className={`w-fit text-white font-medium ${
                                    paper.qRating === "Q1"
                                      ? "bg-blue-700"
                                      : paper.qRating === "Q2"
                                      ? "bg-blue-600"
                                      : paper.qRating === "Q3"
                                      ? "bg-blue-500"
                                      : "bg-gray-600"
                                  }`}
                                >
                                  {paper.qRating}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-4 px-4 align-top hidden lg:table-cell">
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => onToggleExpand(index)}
                                  variant="outline"
                                  size="sm"
                                  className="border-blue-200 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  {expandedIndex === index ? (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-1" />
                                      Hide
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-1" />
                                      View
                                    </>
                                  )}
                                </Button>

                                {showDropdownMenu && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-blue-200 hover:bg-blue-50"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="bg-white border-blue-200"
                                    >
                                      <DropdownMenuLabel className="text-gray-900">
                                        Actions
                                      </DropdownMenuLabel>
                                      <DropdownMenuSeparator className="bg-blue-100" />

                                      {canEdit ? (
                                        <button
                                          onClick={() => openEditDialog(paper)}
                                          className="w-full text-left px-2 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded flex items-center"
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Publication
                                        </button>
                                      ) : (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="w-full text-left px-2 py-1.5 text-sm text-gray-400 rounded flex items-center cursor-not-allowed">
                                                <Lock className="h-4 w-4 mr-2" />
                                                Edit (Own papers only)
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>
                                                You can only edit your own
                                                publications
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}

                                      {canDelete ? (
                                        <DeleteConfirmationDialog
                                          trigger={
                                            <button className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded flex items-center">
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete
                                            </button>
                                          }
                                          title="Delete Publication"
                                          description="This action cannot be undone."
                                          itemName={paper.title}
                                          onConfirm={() => onDelete(paper._id)}
                                          isDeleting={deletingId === paper._id}
                                        />
                                      ) : (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="w-full text-left px-2 py-1.5 text-sm text-gray-400 rounded flex items-center cursor-not-allowed">
                                                <Lock className="h-4 w-4 mr-2" />
                                                Delete (Own papers only)
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>
                                                You can only delete your own
                                                publications
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </td>
                          </tr>

                          {expandedIndex === index && (
                            <tr>
                              <td
                                colSpan={showAuthorInfo ? 6 : 5}
                                className="bg-blue-50 p-6 border-l-4 border-blue-500"
                              >
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  {/* Publication Details */}
                                  <Card className="border border-gray-200 bg-white">
                                    <CardHeader className="pb-3 bg-white-50 border-b border-blue-100">
                                      <CardTitle className="text-lg text-gray-900">
                                        Publication Details
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 pt-4 text-sm text-gray-700">
                                      <p>
                                        <span className="font-semibold">
                                          DOI:
                                        </span>{" "}
                                         <a
                                href={`https://doi.org/${paper.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-s text-grey-600 font-mono break-all hover:underline"
                              >
                                {paper.doi}
                              </a>
                                      </p>
                                      <p>
                                        <span className="font-semibold">
                                          Volume:
                                        </span>{" "}
                                        {paper.volume || "N/A"}
                                        <span className="font-semibold ml-2">
                                          Issue:
                                        </span>{" "}
                                        {paper.issue || "N/A"}
                                      </p>
                                      <p>
                                        <span className="font-semibold">
                                          Pages:
                                        </span>{" "}
                                        {paper.pageNo || "N/A"}
                                      </p>
                                      <p>
                                        <span className="font-semibold">
                                          Publication ID:
                                        </span>{" "}
                                        {paper.publicationId || "N/A"}
                                      </p>
                                      <p>
                                        <span className="font-semibold">
                                          Issue Type:
                                        </span>{" "}
                                        {paper.typeOfIssue || "N/A"}
                                      </p>
                                      {showAuthorInfo && (
                                        <>
                                          <p>
                                            <span className="font-semibold">
                                              Faculty ID:
                                            </span>{" "}
                                            {paper.facultyId}
                                          </p>
                                          <p>
                                            <span className="font-semibold">
                                              Uploaded By:
                                            </span>{" "}
                                            {facultyInfo.fullName}
                                          </p>
                                          <p>
                                            <span className="font-semibold">
                                              Department:
                                            </span>{" "}
                                            {facultyInfo.department}
                                          </p>
                                        </>
                                      )}
                                    </CardContent>
                                  </Card>

                                  {/* Author Information */}
                                  <Card className="border border-gray-200 bg-white">
                                    <CardHeader className="pb-3 bg-white-50 border-b border-blue-100">
                                      <CardTitle className="text-lg text-gray-900">
                                        Author Information
                                      </CardTitle>
                                    </CardHeader>
                                    
                                    <CardContent className="space-y-2 pt-4 text-sm text-gray-700">
                                      <p>
                                        <span className="font-semibold">
                                          Claimed By:
                                        </span>{" "}
                                        {paper.claimedBy || "N/A"}
                                      </p>
                                      <p>
                                        <span className="font-semibold">
                                          Author No:
                                        </span>{" "}
                                        {paper.authorNo || "N/A"}
                                      </p>
                                      <p>
                                        <span className="font-semibold">
                                          Student Scholar:
                                        </span>{" "}
                                        {paper.isStudentScholar || "N/A"}
                                      </p>
                                      {paper.studentScholars?.length > 0 && (
                                        <div>
                                          <span className="font-semibold">
                                            Scholar Names:
                                          </span>
                                          <ul className="mt-1 space-y-1">
                                            {(paper.studentScholars || []).map(
                                              (scholar, idx) => (
                                                <li
                                                  key={idx}
                                                  className="text-xs bg-gray-50 p-1 rounded"
                                                >
                                                  {typeof scholar === "string"
                                                    ? scholar
                                                    : scholar.name}
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      )}
                                      {paper.authors?.length > 0 && (
                                        <div>
                                          <span className="font-semibold">
                                            All Authors:
                                          </span>
                                          <ul className="mt-1 space-y-1">
                                            {paper.authors.map(
                                              (author, idx) => (
                                                <li
                                                  key={idx}
                                                  className="text-xs bg-gray-50 p-1 rounded flex items-center justify-between"
                                                >
                                                  <span>{author.name}</span>
                                                  {author.isCorresponding && (
                                                    <Badge
                                                      variant="outline"
                                                      className="text-xs bg-blue-50 text-blue-700"
                                                    >
                                                      Corresponding
                                                    </Badge>
                                                  )}
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>

                                  {/* Subject Classification */}
                                  <Card className="border border-gray-200 bg-white">
                                    <CardHeader className="pb-3 bg-white-50 border-b border-blue-100">
                                      <CardTitle className="text-lg text-gray-900">
                                        Subject Classification
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 pt-4">
                                      <div>
                                        <span className="text-sm font-semibold text-gray-700">
                                          Subject Area:
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="bg-blue-50 text-blue-700 border-blue-200 ml-2"
                                        >
                                          {paper.subjectArea}
                                        </Badge>
                                      </div>
                                      {paper.subjectCategories?.length > 0 && (
                                        <div>
                                          <span className="text-sm font-semibold text-gray-700">
                                            Categories:
                                          </span>
                                          <div className="flex flex-wrap gap-1 mt-2">
                                            {paper.subjectCategories.map(
                                              (category, i) => (
                                                <Badge
                                                  key={i}
                                                  variant="outline"
                                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                                >
                                                  {category}
                                                </Badge>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      <div className="pt-2 border-t border-gray-200">
                                        <p className="text-xs text-gray-500">
                                          <span className="font-semibold">
                                            Created:
                                          </span>{" "}
                                          {new Date(
                                            paper.createdAt || Date.now()
                                          ).toLocaleDateString()}
                                        </p>
                                        {paper.updatedAt &&
                                          paper.updatedAt !==
                                            paper.createdAt && (
                                            <p className="text-xs text-gray-500">
                                              <span className="font-semibold">
                                                Updated:
                                              </span>{" "}
                                              {new Date(
                                                paper.updatedAt
                                              ).toLocaleDateString()}
                                            </p>
                                          )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Footer */}
              <Pagination
                page={page}
                totalPages={totalPages}
                total={papers.length}
                perPage={PER_PAGE}
                onPageChange={setPage}
                className="border-t border-blue-100"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Mobile/Tablet Full-Screen Modal */}
      <Dialog open={isMobileModalOpen} onOpenChange={setIsMobileModalOpen}>
        <DialogContent 
          className="max-w-none w-screen h-screen max-h-screen m-0 rounded-none p-4 sm:p-6 overflow-y-auto overflow-x-hidden xl:hidden !translate-x-0 !translate-y-0 top-0 left-0 right-0 bottom-0"
          showCloseButton={false}
        >
          {selectedPaperForMobile && mobileModalPermissions && (
            <>
              <DialogHeader className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileModalOpen(false)}
                  className="absolute left-0 top-0 -ml-2 -mt-1 p-2 hover:bg-gray-100 z-10"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-700" />
                </Button>
                {mobileModalPermissions.showDropdownMenuValue && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 -mr-2 -mt-1 p-2 hover:bg-gray-100 z-10"
                      >
                        <MoreHorizontal className="h-5 w-5 text-gray-700" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border-blue-200">
                      <DropdownMenuLabel className="text-gray-900">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-blue-100" />
                      {mobileModalPermissions.canEditPaperValue && (
                        <button
                          onClick={() => {
                            setIsMobileModalOpen(false);
                            openEditDialog(selectedPaperForMobile);
                          }}
                          className="w-full text-left px-2 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Publication
                        </button>
                      )}
                      {mobileModalPermissions.canDeletePaperValue && (
                        <DeleteConfirmationDialog
                          trigger={
                            <button className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded flex items-center">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </button>
                          }
                          title="Delete Publication"
                          description="This action cannot be undone."
                          itemName={selectedPaperForMobile.title}
                          onConfirm={() => {
                            setIsMobileModalOpen(false);
                            onDelete(selectedPaperForMobile._id);
                          }}
                          isDeleting={deletingId === selectedPaperForMobile._id}
                        />
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <DialogTitle className="text-xl font-bold text-gray-900 pr-8 pl-10 break-words text-left">
                  {selectedPaperForMobile.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Author Information - First */}
                <Card className="border border-gray-200 bg-white">
                  <CardHeader className="pb-3 bg-white-50 border-b border-blue-100">
                    <CardTitle className="text-lg text-gray-900">
                      Author Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-4 text-sm text-gray-700">
                    <p className="text-left">
                      <span className="font-semibold">Authors:</span>{" "}
                      {selectedPaperForMobile.authors
                        ?.map((a) =>
                          a.isCorresponding ? `${a.name} (C)` : a.name
                        )
                        .join(", ") || "N/A"}
                    </p>
                    <p className="text-left">
                      <span className="font-semibold">Claimed By:</span>{" "}
                      {selectedPaperForMobile.claimedBy || "N/A"}
                    </p>
                    <p className="text-left">
                      <span className="font-semibold">Author No:</span>{" "}
                      {selectedPaperForMobile.authorNo || "N/A"}
                    </p>
                    <p className="text-left">
                      <span className="font-semibold">Student Scholar:</span>{" "}
                      {selectedPaperForMobile.isStudentScholar || "N/A"}
                    </p>
                    {selectedPaperForMobile.studentScholars?.length > 0 && (
                      <div className="text-left">
                        <span className="font-semibold">Scholar Names:</span>
                        <ul className="mt-1 space-y-1">
                          {(selectedPaperForMobile.studentScholars || []).map(
                            (scholar, idx) => (
                              <li
                                key={idx}
                                className="text-xs bg-gray-50 p-1 rounded"
                              >
                                {typeof scholar === "string"
                                  ? scholar
                                  : scholar.name}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Metrics & Classification - Second */}
                <Card className="border border-gray-200 bg-white">
                  <CardHeader className="pb-3 bg-white-50 border-b border-blue-100">
                    <CardTitle className="text-lg text-gray-900">
                      Metrics & Classification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-sm font-semibold text-gray-700">
                        Year:
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-800 font-medium"
                      >
                        {selectedPaperForMobile.year}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-sm font-semibold text-gray-700">
                        Q Rating:
                      </span>
                      <Badge
                        className={`text-white font-medium ${
                          selectedPaperForMobile.qRating === "Q1"
                            ? "bg-blue-700"
                            : selectedPaperForMobile.qRating === "Q2"
                            ? "bg-blue-600"
                            : selectedPaperForMobile.qRating === "Q3"
                            ? "bg-blue-500"
                            : "bg-gray-600"
                        }`}
                      >
                        {selectedPaperForMobile.qRating}
                      </Badge>
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-semibold text-gray-700">
                        Subject Area:
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 ml-2"
                      >
                        {selectedPaperForMobile.subjectArea}
                      </Badge>
                    </div>
                    {selectedPaperForMobile.subjectCategories?.length > 0 && (
                      <div className="text-left">
                        <span className="text-sm font-semibold text-gray-700">
                          Categories:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedPaperForMobile.subjectCategories.map(
                            (category, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {category}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Publication Details - Third */}
                <Card className="border border-gray-200 bg-white">
                  <CardHeader className="pb-3 bg-white-50 border-b border-blue-100">
                    <CardTitle className="text-lg text-gray-900">
                      Publication Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-4 text-sm text-gray-700">
                    <p className="text-left">
                      <span className="font-semibold">DOI:</span>{" "}
                      <a
                        href={`https://doi.org/${selectedPaperForMobile.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 font-mono break-all hover:underline"
                      >
                        {selectedPaperForMobile.doi}
                      </a>
                    </p>
                    <p className="text-left">
                      <span className="font-semibold">Journal:</span>{" "}
                      {selectedPaperForMobile.journal || "N/A"}
                    </p>
                    <p className="text-left">
                      <span className="font-semibold">Publisher:</span>{" "}
                      {selectedPaperForMobile.publisher || "N/A"}
                    </p>
                    <p className="text-left">
                      <span className="font-semibold">Volume:</span>{" "}
                      {selectedPaperForMobile.volume || "N/A"}
                      <span className="font-semibold ml-2">Issue:</span>{" "}
                      {selectedPaperForMobile.issue || "N/A"}
                    </p>
                    <p className="text-left">
                      <span className="font-semibold">Pages:</span>{" "}
                      {selectedPaperForMobile.pageNo || "N/A"}
                    </p>
                    <p className="text-left">
                      <span className="font-semibold">Publication ID:</span>{" "}
                      {selectedPaperForMobile.publicationId || "N/A"}
                    </p>
                    <p className="text-left">
                      <span className="font-semibold">Issue Type:</span>{" "}
                      {selectedPaperForMobile.typeOfIssue || "N/A"}
                    </p>
                    {showAuthorInfo && (
                      <>
                        <p className="text-left">
                          <span className="font-semibold">Faculty ID:</span>{" "}
                          {selectedPaperForMobile.facultyId}
                        </p>
                        <p className="text-left">
                          <span className="font-semibold">Uploaded By:</span>{" "}
                          {getFacultyInfo(selectedPaperForMobile.facultyId).fullName}
                        </p>
                        <p className="text-left">
                          <span className="font-semibold">Department:</span>{" "}
                          {getFacultyInfo(selectedPaperForMobile.facultyId).department}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
