import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Pagination UI component for server-side pagination
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
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 bg-white ${className}`}>
            {/* Page Info */}
            {showPageInfo && (
                <div className="text-sm text-gray-700">
                    {total === 0 ? (
                        <span>No results</span>
                    ) : (
                        <>
                            Showing <span className="font-medium">{startItem}</span> to{' '}
                            <span className="font-medium">{endItem}</span> of{' '}
                            <span className="font-medium">{total.toLocaleString()}</span> results
                        </>
                    )}
                </div>
            )}

            <div className="flex items-center gap-4">
                {/* Limit Selector */}
                {showLimitSelector && onLimitChange && (
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 whitespace-nowrap">Per page:</label>
                        <select
                            value={limit}
                            onChange={(e) => onLimitChange?.(Number(e.target.value))}
                            disabled={loading}
                            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                        >
                            {limitOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Navigation Buttons */}
                <nav className="flex items-center gap-1" aria-label="Pagination">
                    <button
                        onClick={() => handlePageChange(1)}
                        disabled={!hasPrevPage || loading}
                        className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                        title="First page"
                        aria-label="Go to first page"
                    >
                        <ChevronsLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={!hasPrevPage || loading}
                        className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                        title="Previous page"
                        aria-label="Go to previous page"
                    >
                        <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>

                    <span className="px-3 py-1.5 text-sm text-gray-700 tabular-nums">
                        Page <span className="font-medium">{page}</span> of{' '}
                        <span className="font-medium">{totalPages || 1}</span>
                    </span>

                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!hasNextPage || loading}
                        className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                        title="Next page"
                        aria-label="Go to next page"
                    >
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={!hasNextPage || loading}
                        className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                        title="Last page"
                        aria-label="Go to last page"
                    >
                        <ChevronsRight className="h-5 w-5 text-gray-600" />
                    </button>
                </nav>
            </div>
        </div>
    );
}

export default Pagination;
