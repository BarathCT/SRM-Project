import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

/**
 * Reusable Pagination component for server-side pagination
 */
const Pagination = ({
    page = 1,
    totalPages = 1,
    total = 0,
    limit = 15,
    onPageChange,
    onLimitChange,
    showPageSize = true,
    showInfo = true,
    pageSizeOptions = [10, 15, 25, 50],
    className = ''
}) => {
    const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    const canGoPrevious = page > 1;
    const canGoNext = page < totalPages;

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
            onPageChange(newPage);
        }
    };

    const handleLimitChange = (newLimit) => {
        if (onLimitChange) {
            onLimitChange(Number(newLimit));
        }
    };

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show first, last, and pages around current
            const start = Math.max(1, page - 1);
            const end = Math.min(totalPages, page + 1);

            if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push('...');
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (total === 0) {
        return null;
    }

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 ${className}`}>
            {/* Info section */}
            {showInfo && (
                <div className="text-sm text-gray-600">
                    Showing <span className="font-medium">{startItem}</span> to{' '}
                    <span className="font-medium">{endItem}</span> of{' '}
                    <span className="font-medium">{total}</span> results
                </div>
            )}

            <div className="flex items-center gap-4">
                {/* Page size selector */}
                {showPageSize && onLimitChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Show</span>
                        <Select value={String(limit)} onValueChange={handleLimitChange}>
                            <SelectTrigger className="w-[70px] h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {pageSizeOptions.map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Pagination controls */}
                <div className="flex items-center gap-1">
                    {/* First page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(1)}
                        disabled={!canGoPrevious}
                        title="First page"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    {/* Previous page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={!canGoPrevious}
                        title="Previous page"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page numbers */}
                    <div className="hidden sm:flex items-center gap-1">
                        {getPageNumbers().map((pageNum, index) => (
                            pageNum === '...' ? (
                                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                                    ...
                                </span>
                            ) : (
                                <Button
                                    key={pageNum}
                                    variant={page === pageNum ? 'default' : 'outline'}
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handlePageChange(pageNum)}
                                >
                                    {pageNum}
                                </Button>
                            )
                        ))}
                    </div>

                    {/* Mobile page indicator */}
                    <span className="sm:hidden text-sm text-gray-600 px-2">
                        {page} / {totalPages}
                    </span>

                    {/* Next page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!canGoNext}
                        title="Next page"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Last page */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={!canGoNext}
                        title="Last page"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export { Pagination };
export default Pagination;
