import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Pagination UI component for server-side pagination
 * Responsive: Stacks vertically on mobile, horizontal on tablet+
 */
export function Pagination({
    page = 1,
    totalPages = 1,
    total = 0,
    limit = 15,
    hasNextPage = false,
    hasPrevPage = false,
    onPageChange,
    onLimitChange,
    showPageInfo = true,
    showLimitSelector = true,
    limitOptions = [10, 15, 25, 50],
    loading = false,
    className = ''
}) {
    const startItem = total === 0 ? 0 : Math.min((page - 1) * limit + 1, total);
    const endItem = Math.min(page * limit, total);

    const handlePageChange = (newPage) => {
        if (loading) return;
        if (newPage >= 1 && newPage <= totalPages) {
            onPageChange?.(newPage);
        }
    };

    return (
        <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 py-3 border-t border-gray-200 bg-white ${className}`}>
            {/* Page Info */}
            {showPageInfo && (
                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                    {total === 0 ? (
                        <span>No results</span>
                    ) : (
                        <>
                            <span className="hidden sm:inline">Showing </span>
                            <span className="font-medium">{startItem}</span>
                            <span className="hidden sm:inline"> to</span>
                            <span className="sm:hidden">-</span>{' '}
                            <span className="font-medium">{endItem}</span>
                            <span className="hidden sm:inline"> of</span>
                            <span className="sm:hidden">/</span>{' '}
                            <span className="font-medium">{total.toLocaleString()}</span>
                            <span className="hidden sm:inline"> results</span>
                        </>
                    )}
                </div>
            )}

            <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-4">
                {/* Limit Selector - Hide on very small screens */}
                {showLimitSelector && onLimitChange && (
                    <div className="hidden xs:flex sm:flex items-center gap-1 sm:gap-2">
                        <label className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Per page:</label>
                        <select
                            value={limit}
                            onChange={(e) => onLimitChange?.(Number(e.target.value))}
                            disabled={loading}
                            className="border border-gray-300 rounded-md px-1.5 sm:px-2 py-1 sm:py-1.5 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                        >
                            {limitOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Navigation Buttons - Larger touch targets on mobile */}
                <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Pagination">
                    {/* First page - hide on mobile for cleaner UI */}
                    <button
                        onClick={() => handlePageChange(1)}
                        disabled={!hasPrevPage || loading}
                        className="hidden sm:block p-1.5 sm:p-2 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                        title="First page"
                        aria-label="Go to first page"
                    >
                        <ChevronsLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                    </button>
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={!hasPrevPage || loading}
                        className="p-2 sm:p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors min-h-[44px] sm:min-h-0"
                        title="Previous page"
                        aria-label="Go to previous page"
                    >
                        <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>

                    <span className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-700 tabular-nums whitespace-nowrap">
                        <span className="font-medium">{page}</span>
                        <span className="text-gray-500"> / </span>
                        <span className="font-medium">{totalPages || 1}</span>
                    </span>

                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!hasNextPage || loading}
                        className="p-2 sm:p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors min-h-[44px] sm:min-h-0"
                        title="Next page"
                        aria-label="Go to next page"
                    >
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                    {/* Last page - hide on mobile for cleaner UI */}
                    <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={!hasNextPage || loading}
                        className="hidden sm:block p-1.5 sm:p-2 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                        title="Last page"
                        aria-label="Go to last page"
                    >
                        <ChevronsRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                    </button>
                </nav>
            </div>
        </div>
    );
}

export default Pagination;
