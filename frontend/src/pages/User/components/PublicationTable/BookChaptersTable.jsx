import React, { useMemo, useState, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
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
    BookOpen,
    Eye,
    EyeOff,
    MoreHorizontal,
    Trash2,
    Edit,
    X,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
} from "lucide-react";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

export default function BookChaptersTable({
    chapters,
    selectedChapters,
    selectAll,
    onToggleSelectAll,
    onToggleSelect,
    expandedIndex,
    onToggleExpand,
    onEdit,
    onDelete,
    deletingId,
    hasActiveFilters,
    onClearFilters,
}) {
    const noResults = chapters.length === 0;

    // Pagination
    const PER_PAGE = 15;
    const [page, setPage] = useState(1);

    // Mobile/Tablet full-screen modal state
    const [selectedChapterForMobile, setSelectedChapterForMobile] = useState(null);
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(chapters.length / PER_PAGE)),
        [chapters.length]
    );

    const pageSlice = useMemo(() => {
        const start = (page - 1) * PER_PAGE;
        return { start, end: start + PER_PAGE };
    }, [page]);

    const displayedChapters = useMemo(() => {
        const start = (page - 1) * PER_PAGE;
        const end = start + PER_PAGE;
        return chapters.slice(start, end);
    }, [chapters, page]);

    // Reset page when chapters change
    React.useEffect(() => {
        setPage(1);
    }, [chapters]);

    // Pagination Controls
    const PaginationControls = () => {
        if (totalPages <= 1) return null;
        const MAX_NUMBERS = 7;
        const pages = [];
        const push = (p) => pages.push(p);

        if (totalPages <= MAX_NUMBERS) {
            for (let i = 1; i <= totalPages; i++) push(i);
        } else {
            const left = Math.max(2, page - 1);
            const right = Math.min(totalPages - 1, page + 1);
            push(1);
            if (left > 2) push("left-ellipsis");
            for (let i = left; i <= right; i++) push(i);
            if (right < totalPages - 1) push("right-ellipsis");
            push(totalPages);
        }

        return (
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                {pages.map((p, idx) =>
                    typeof p === "number" ? (
                        <Button
                            key={idx}
                            variant={p === page ? "default" : "outline"}
                            size="sm"
                            className={
                                p === page ? "bg-blue-600 text-white" : "border-blue-200"
                            }
                            onClick={() => setPage(p)}
                        >
                            {p}
                        </Button>
                    ) : (
                        <span key={idx} className="px-2 text-gray-500 select-none">
                            …
                        </span>
                    )
                )}
                <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        );
    };

    return (
        <Card className="border border-gray-200 bg-white">
            <CardHeader className="bg-white-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                            Book Chapters
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Your book chapter publications
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {noResults ? (
                    <div className="text-center py-16 bg-white">
                        <BookOpen className="h-20 w-20 text-blue-200 mx-auto mb-6" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No book chapters found
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {hasActiveFilters
                                ? "Try adjusting your filters or search query"
                                : "You haven't uploaded any book chapters yet"}
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
                                        <th className="py-4 px-4 text-left">
                                            <Checkbox
                                                checked={selectAll}
                                                onCheckedChange={onToggleSelectAll}
                                                className="border-blue-300"
                                            />
                                        </th>
                                        <th className="py-4 px-4 text-left font-semibold text-gray-900">
                                            Chapter / Book Details
                                        </th>
                                        <th className="py-4 px-4 text-left font-semibold text-gray-900 hidden md:table-cell">
                                            Publisher
                                        </th>
                                        <th className="py-4 px-4 text-left font-semibold text-gray-900">
                                            Year / Index
                                        </th>
                                        <th className="py-4 px-4 text-left font-semibold text-gray-900 hidden lg:table-cell">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-100">
                                    {displayedChapters.map((chapter, index) => {
                                        const handleRowClick = (e) => {
                                            if (
                                                e.target.closest('input[type="checkbox"]') ||
                                                e.target.closest('button') ||
                                                e.target.closest('[role="button"]')
                                            ) {
                                                return;
                                            }
                                            if (window.innerWidth < 1024) {
                                                setSelectedChapterForMobile(chapter);
                                                setIsMobileModalOpen(true);
                                            }
                                        };

                                        return (
                                            <React.Fragment key={chapter._id}>
                                                <tr 
                                                    className="hover:bg-blue-50/60 transition-colors lg:cursor-default cursor-pointer"
                                                    onClick={handleRowClick}
                                                >
                                                    <td className="py-3 px-2 md:py-4 md:px-4">
                                                        <Checkbox
                                                            checked={selectedChapters.has(chapter._id)}
                                                            onCheckedChange={() => onToggleSelect(chapter._id)}
                                                            className="border-blue-300"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-2 md:py-4 md:px-4 align-top">
                                                        <div className="space-y-2">
                                                            <h4 className="font-semibold text-gray-900 leading-tight text-sm lg:text-base line-clamp-2">
                                                                {chapter.chapterTitle}
                                                            </h4>
                                                            <p className="text-sm text-gray-600 hidden lg:block">
                                                                <span className="font-medium">Book:</span>{" "}
                                                                {chapter.bookTitle}
                                                            </p>
                                                            <p className="text-sm text-gray-600 hidden lg:block">
                                                                <span className="font-medium">Authors:</span>{" "}
                                                                {chapter.authors
                                                                    ?.slice(0, 3)
                                                                    .map((a) => a.name)
                                                                    .join(", ")}
                                                                {chapter.authors?.length > 3 && (
                                                                    <span className="text-blue-700">
                                                                        {" "}
                                                                        +{chapter.authors.length - 3} more
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <div className="flex flex-wrap gap-1">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                                                >
                                                                    Ch. {chapter.chapterNumber || "N/A"}
                                                                </Badge>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                                                >
                                                                    {chapter.subjectArea}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 md:py-4 md:px-4 hidden md:table-cell align-top">
                                                        <p className="font-medium text-gray-900">
                                                            {chapter.publisher}
                                                        </p>
                                                        <p className="text-sm text-gray-600 font-mono">
                                                            ISBN: {chapter.isbn}
                                                        </p>
                                                        {chapter.bookSeries && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {chapter.bookSeries}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-2 md:py-4 md:px-4 align-top">
                                                        <div className="flex flex-col sm:block space-y-1 sm:space-y-2">
                                                            <Badge
                                                                variant="secondary"
                                                                className="bg-gray-100 text-gray-800 font-medium w-fit"
                                                            >
                                                                {chapter.year}
                                                            </Badge>
                                                            {chapter.indexedIn && (
                                                                <Badge
                                                                    className={`w-fit text-white font-medium ${chapter.indexedIn === "Scopus"
                                                                            ? "bg-blue-700"
                                                                            : "bg-green-600"
                                                                        }`}
                                                                >
                                                                    {chapter.indexedIn}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 md:py-4 md:px-4 align-top hidden lg:table-cell">
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

                                                                <button
                                                                    onClick={() => onEdit(chapter)}
                                                                    className="w-full text-left px-2 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded flex items-center"
                                                                >
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit Chapter
                                                                </button>

                                                                <DeleteConfirmationDialog
                                                                    trigger={
                                                                        <button className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded flex items-center">
                                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                                            Delete
                                                                        </button>
                                                                    }
                                                                    title="Delete Book Chapter"
                                                                    description="This action cannot be undone."
                                                                    itemName={chapter.chapterTitle}
                                                                    onConfirm={() => onDelete(chapter._id)}
                                                                    isDeleting={deletingId === chapter._id}
                                                                />
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </tr>

                                            {expandedIndex === index && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
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
                                                                        <span className="font-semibold">ISBN:</span>{" "}
                                                                        {chapter.isbn}
                                                                    </p>
                                                                    {chapter.doi && (
                                                                        <p>
                                                                            <span className="font-semibold">DOI:</span>{" "}
                                                                            <a
                                                                                href={`https://doi.org/${chapter.doi}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-blue-600 hover:underline"
                                                                            >
                                                                                {chapter.doi}
                                                                            </a>
                                                                        </p>
                                                                    )}
                                                                    <p>
                                                                        <span className="font-semibold">Pages:</span>{" "}
                                                                        {chapter.pageRange}
                                                                    </p>
                                                                    {chapter.edition && (
                                                                        <p>
                                                                            <span className="font-semibold">Edition:</span>{" "}
                                                                            {chapter.edition}
                                                                        </p>
                                                                    )}
                                                                    {chapter.volume && (
                                                                        <p>
                                                                            <span className="font-semibold">Volume:</span>{" "}
                                                                            {chapter.volume}
                                                                        </p>
                                                                    )}
                                                                </CardContent>
                                                            </Card>

                                                            {/* Author Information */}
                                                            <Card className="border border-gray-200 bg-white">
                                                                <CardHeader className="pb-3 bg-white-50 border-b border-blue-100">
                                                                    <CardTitle className="text-lg text-gray-900">
                                                                        Author & Editors
                                                                    </CardTitle>
                                                                </CardHeader>
                                                                <CardContent className="space-y-2 pt-4 text-sm text-gray-700">
                                                                    <p>
                                                                        <span className="font-semibold">Claimed By:</span>{" "}
                                                                        {chapter.claimedBy || "N/A"}
                                                                    </p>
                                                                    <p>
                                                                        <span className="font-semibold">Author No:</span>{" "}
                                                                        {chapter.authorNo || "N/A"}
                                                                    </p>
                                                                    {chapter.editors?.length > 0 && (
                                                                        <div>
                                                                            <span className="font-semibold">Editors:</span>
                                                                            <ul className="mt-1 space-y-1">
                                                                                {chapter.editors.map((editor, idx) => (
                                                                                    <li
                                                                                        key={idx}
                                                                                        className="text-xs bg-gray-50 p-1 rounded"
                                                                                    >
                                                                                        {editor}
                                                                                    </li>
                                                                                ))}
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
                                                                            {chapter.subjectArea}
                                                                        </Badge>
                                                                    </div>
                                                                    {chapter.subjectCategories?.length > 0 && (
                                                                        <div>
                                                                            <span className="text-sm font-semibold text-gray-700">
                                                                                Categories:
                                                                            </span>
                                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                                {chapter.subjectCategories.map(
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

                        {/* Pagination Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-blue-100 bg-white-50">
                            <p className="text-sm text-gray-600">
                                Showing {chapters.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–
                                {Math.min(page * PER_PAGE, chapters.length)} of {chapters.length}
                            </p>
                            <PaginationControls />
                        </div>
                    </>
                )}
            </CardContent>
        </Card>

        {/* Mobile/Tablet Full-Screen Modal */}
        <Dialog open={isMobileModalOpen} onOpenChange={setIsMobileModalOpen}>
            <DialogContent 
                className="max-w-none w-screen h-screen max-h-screen m-0 rounded-none p-4 sm:p-6 overflow-y-auto lg:hidden !translate-x-0 !translate-y-0 top-0 left-0 right-0 bottom-0"
                showCloseButton={false}
            >
                {selectedChapterForMobile && (
                    <>
                        <DialogHeader className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsMobileModalOpen(false)}
                                className="absolute left-0 top-0 -ml-2 -mt-1 p-2 hover:bg-gray-100"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-700" />
                            </Button>
                            <DialogTitle className="text-xl font-bold text-gray-900 pr-8">
                                {selectedChapterForMobile.chapterTitle}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 mt-4">
                            {/* Chapter Details */}
                            <Card className="border border-gray-200 bg-white">
                                <CardHeader className="pb-3 bg-white-50 border-b border-blue-100">
                                    <CardTitle className="text-lg text-gray-900">
                                        Chapter Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 pt-4 text-sm text-gray-700">
                                    <p>
                                        <span className="font-semibold">Book Title:</span>{" "}
                                        {selectedChapterForMobile.bookTitle || "N/A"}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Chapter Number:</span>{" "}
                                        {selectedChapterForMobile.chapterNumber || "N/A"}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Publisher:</span>{" "}
                                        {selectedChapterForMobile.publisher || "N/A"}
                                    </p>
                                    <p>
                                        <span className="font-semibold">ISBN:</span>{" "}
                                        {selectedChapterForMobile.isbn || "N/A"}
                                    </p>
                                    {selectedChapterForMobile.bookSeries && (
                                        <p>
                                            <span className="font-semibold">Book Series:</span>{" "}
                                            {selectedChapterForMobile.bookSeries}
                                        </p>
                                    )}
                                    <p>
                                        <span className="font-semibold">Year:</span>{" "}
                                        {selectedChapterForMobile.year || "N/A"}
                                    </p>
                                    {selectedChapterForMobile.indexedIn && (
                                        <p>
                                            <span className="font-semibold">Indexed In:</span>{" "}
                                            <Badge
                                                className={`text-white font-medium ${
                                                    selectedChapterForMobile.indexedIn === "Scopus"
                                                        ? "bg-blue-700"
                                                        : "bg-green-600"
                                                }`}
                                            >
                                                {selectedChapterForMobile.indexedIn}
                                            </Badge>
                                        </p>
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
                                        <span className="font-semibold">Authors:</span>{" "}
                                        {selectedChapterForMobile.authors
                                            ?.map((a) => a.name)
                                            .join(", ") || "N/A"}
                                    </p>
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
                                            {selectedChapterForMobile.subjectArea}
                                        </Badge>
                                    </div>
                                    {selectedChapterForMobile.subjectCategories?.length > 0 && (
                                        <div>
                                            <span className="text-sm font-semibold text-gray-700">
                                                Categories:
                                            </span>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {selectedChapterForMobile.subjectCategories.map(
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

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200">
                                <Button
                                    onClick={() => {
                                        setIsMobileModalOpen(false);
                                        onEdit(selectedChapterForMobile);
                                    }}
                                    variant="outline"
                                    className="flex-1 border-blue-200 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Chapter
                                </Button>
                                <DeleteConfirmationDialog
                                    trigger={
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-red-200 hover:border-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </Button>
                                    }
                                    title="Delete Book Chapter"
                                    description="This action cannot be undone."
                                    itemName={selectedChapterForMobile.chapterTitle}
                                    onConfirm={() => {
                                        setIsMobileModalOpen(false);
                                        onDelete(selectedChapterForMobile._id);
                                    }}
                                    isDeleting={deletingId === selectedChapterForMobile._id}
                                />
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
