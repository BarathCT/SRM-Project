import React, { useMemo, useState } from "react";
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
    Presentation,
    Eye,
    EyeOff,
    MoreHorizontal,
    Trash2,
    Edit,
    X,
    MapPin,
    Calendar,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

export default function ConferencePapersTable({
    papers,
    selectedPapers,
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
    const noResults = papers.length === 0;

    // Pagination
    const PER_PAGE = 15;
    const [page, setPage] = useState(1);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(papers.length / PER_PAGE)),
        [papers.length]
    );

    const pageSlice = useMemo(() => {
        const start = (page - 1) * PER_PAGE;
        return { start, end: start + PER_PAGE };
    }, [page]);

    const displayedPapers = useMemo(
        () => papers.slice(pageSlice.start, pageSlice.end),
        [papers, pageSlice]
    );

    // Reset page when papers change
    React.useEffect(() => {
        setPage(1);
    }, [papers]);

    const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

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
                            <Presentation className="h-5 w-5 text-blue-600" />
                            Conference Papers
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Your conference paper publications
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {noResults ? (
                    <div className="text-center py-16 bg-white">
                        <Presentation className="h-20 w-20 text-blue-200 mx-auto mb-6" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No conference papers found
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {hasActiveFilters
                                ? "Try adjusting your filters or search query"
                                : "You haven't uploaded any conference papers yet"}
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
                                <thead className="bg-white-50 border-b border-blue-100">
                                    <tr>
                                        <th className="py-4 px-4 text-left">
                                            <Checkbox
                                                checked={selectAll}
                                                onCheckedChange={onToggleSelectAll}
                                                className="border-blue-300"
                                            />
                                        </th>
                                        <th className="py-4 px-4 text-left font-semibold text-gray-900">
                                            Paper / Conference
                                        </th>
                                        <th className="py-4 px-4 text-left font-semibold text-gray-900 hidden md:table-cell">
                                            Location
                                        </th>
                                        <th className="py-4 px-4 text-left font-semibold text-gray-900">
                                            Type / Mode
                                        </th>
                                        <th className="py-4 px-4 text-left font-semibold text-gray-900">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-100">
                                    {displayedPapers.map((paper, index) => (
                                        <React.Fragment key={paper._id}>
                                            <tr className="hover:bg-blue-50/60 transition-colors">
                                                <td className="py-4 px-4">
                                                    <Checkbox
                                                        checked={selectedPapers.has(paper._id)}
                                                        onCheckedChange={() => onToggleSelect(paper._id)}
                                                        className="border-blue-300"
                                                    />
                                                </td>
                                                <td className="py-4 px-4 align-top">
                                                    <div className="space-y-2">
                                                        <h4 className="font-semibold text-gray-900 leading-tight">
                                                            {paper.title}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            <span className="font-medium">Conference:</span>{" "}
                                                            {paper.conferenceName}
                                                            {paper.conferenceShortName && (
                                                                <span className="text-blue-700">
                                                                    {" "}
                                                                    ({paper.conferenceShortName})
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            <span className="font-medium">Authors:</span>{" "}
                                                            {paper.authors
                                                                ?.slice(0, 3)
                                                                .map((a) =>
                                                                    a.isCorresponding ? `${a.name} (C)` : a.name
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
                                                                variant="secondary"
                                                                className="bg-gray-100 text-gray-800 font-medium"
                                                            >
                                                                {paper.year}
                                                            </Badge>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                                            >
                                                                {paper.subjectArea}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 hidden md:table-cell align-top">
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-gray-900 flex items-center gap-1">
                                                            <MapPin className="h-3 w-3 text-gray-500" />
                                                            {paper.conferenceLocation?.city},{" "}
                                                            {paper.conferenceLocation?.country}
                                                        </p>
                                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 text-gray-500" />
                                                            {formatDate(paper.conferenceStartDate)} -{" "}
                                                            {formatDate(paper.conferenceEndDate)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {paper.organizer}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 align-top">
                                                    <div className="space-y-2">
                                                        <Badge
                                                            className={`w-fit text-white font-medium ${paper.conferenceType === "International"
                                                                    ? "bg-blue-700"
                                                                    : "bg-green-600"
                                                                }`}
                                                        >
                                                            {paper.conferenceType}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className={`block w-fit text-xs ${paper.conferenceMode === "Online"
                                                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                                                    : paper.conferenceMode === "Offline"
                                                                        ? "bg-gray-50 text-gray-700 border-gray-200"
                                                                        : "bg-orange-50 text-orange-700 border-orange-200"
                                                                }`}
                                                        >
                                                            {paper.conferenceMode}
                                                        </Badge>
                                                        {paper.indexedIn && (
                                                            <Badge
                                                                variant="outline"
                                                                className="block w-fit text-xs bg-green-50 text-green-700 border-green-200"
                                                            >
                                                                {paper.indexedIn}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 align-top">
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
                                                                    onClick={() => onEdit(paper)}
                                                                    className="w-full text-left px-2 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded flex items-center"
                                                                >
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit Paper
                                                                </button>

                                                                <DeleteConfirmationDialog
                                                                    trigger={
                                                                        <button className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded flex items-center">
                                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                                            Delete
                                                                        </button>
                                                                    }
                                                                    title="Delete Conference Paper"
                                                                    description="This action cannot be undone."
                                                                    itemName={paper.title}
                                                                    onConfirm={() => onDelete(paper._id)}
                                                                    isDeleting={deletingId === paper._id}
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
                                                            {/* Conference Details */}
                                                            <Card className="border border-gray-200 bg-white">
                                                                <CardHeader className="pb-3 bg-white-50 border-b border-blue-100">
                                                                    <CardTitle className="text-lg text-gray-900">
                                                                        Conference Details
                                                                    </CardTitle>
                                                                </CardHeader>
                                                                <CardContent className="space-y-2 pt-4 text-sm text-gray-700">
                                                                    <p>
                                                                        <span className="font-semibold">Organizer:</span>{" "}
                                                                        {paper.organizer}
                                                                    </p>
                                                                    <p>
                                                                        <span className="font-semibold">Publisher:</span>{" "}
                                                                        {paper.proceedingsPublisher}
                                                                    </p>
                                                                    {paper.proceedingsTitle && (
                                                                        <p>
                                                                            <span className="font-semibold">
                                                                                Proceedings:
                                                                            </span>{" "}
                                                                            {paper.proceedingsTitle}
                                                                        </p>
                                                                    )}
                                                                    {paper.presentationType && (
                                                                        <p>
                                                                            <span className="font-semibold">
                                                                                Presentation:
                                                                            </span>{" "}
                                                                            {paper.presentationType}
                                                                        </p>
                                                                    )}
                                                                    {paper.acceptanceRate && (
                                                                        <p>
                                                                            <span className="font-semibold">
                                                                                Acceptance Rate:
                                                                            </span>{" "}
                                                                            {paper.acceptanceRate}
                                                                        </p>
                                                                    )}
                                                                </CardContent>
                                                            </Card>

                                                            {/* Publication Details */}
                                                            <Card className="border border-gray-200 bg-white">
                                                                <CardHeader className="pb-3 bg-white-50 border-b border-blue-100">
                                                                    <CardTitle className="text-lg text-gray-900">
                                                                        Publication Details
                                                                    </CardTitle>
                                                                </CardHeader>
                                                                <CardContent className="space-y-2 pt-4 text-sm text-gray-700">
                                                                    {paper.isbn && (
                                                                        <p>
                                                                            <span className="font-semibold">ISBN:</span>{" "}
                                                                            {paper.isbn}
                                                                        </p>
                                                                    )}
                                                                    {paper.doi && (
                                                                        <p>
                                                                            <span className="font-semibold">DOI:</span>{" "}
                                                                            <a
                                                                                href={`https://doi.org/${paper.doi}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-blue-600 hover:underline"
                                                                            >
                                                                                {paper.doi}
                                                                            </a>
                                                                        </p>
                                                                    )}
                                                                    {paper.pageNo && (
                                                                        <p>
                                                                            <span className="font-semibold">Pages:</span>{" "}
                                                                            {paper.pageNo}
                                                                        </p>
                                                                    )}
                                                                    <p>
                                                                        <span className="font-semibold">Claimed By:</span>{" "}
                                                                        {paper.claimedBy || "N/A"}
                                                                    </p>
                                                                    <p>
                                                                        <span className="font-semibold">Author No:</span>{" "}
                                                                        {paper.authorNo || "N/A"}
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
                                                                </CardContent>
                                                            </Card>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-blue-100 bg-white-50">
                            <p className="text-sm text-gray-600">
                                Showing {pageSlice.start + 1}–
                                {Math.min(pageSlice.end, papers.length)} of {papers.length}
                            </p>
                            <PaginationControls />
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
