import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Reusable Pagination Component
 * 
 * @param {Object} props
 * @param {number} props.page - Current page number (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.total - Total number of items
 * @param {number} props.perPage - Number of items per page
 * @param {Function} props.onPageChange - Callback function when page changes (receives new page number)
 * @param {string} props.className - Additional CSS classes for the container
 * @param {boolean} props.showInfo - Whether to show the "Showing X to Y of Z results" text (default: true)
 */
export default function Pagination({
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
  className = '',
  showInfo = true,
}) {
  // Don't render if there are no items
  if (total <= 0 || totalPages <= 0) return null;

  const MAX_NUMBERS = 7;
  const pages = [];
  const push = (p) => pages.push(p);

  // Generate page numbers with ellipsis
  if (totalPages <= MAX_NUMBERS) {
    // Show all pages if total is less than MAX_NUMBERS
    for (let i = 1; i <= totalPages; i++) push(i);
  } else {
    // Show first, last, and pages around current page with ellipsis
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    push(1);
    if (left > 2) push("left-ellipsis");
    for (let i = left; i <= right; i++) push(i);
    if (right < totalPages - 1) push("right-ellipsis");
    push(totalPages);
  }

  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  const handlePageClick = (pageNum) => {
    if (pageNum !== page) {
      onPageChange(pageNum);
    }
  };

  // Calculate display range
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  return (
    <div className={`flex items-center justify-between w-full mt-4 pt-4 pb-4 px-4 border-t border-gray-200 ${className}`}>
      {showInfo && (
        <div className="text-sm text-gray-700">
          Showing <span className="font-semibold">{start}</span> to{' '}
          <span className="font-semibold">{end}</span> of{' '}
          <span className="font-semibold">{total}</span> results
        </div>
      )}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="border-blue-200"
          onClick={handlePrevious}
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
              onClick={() => handlePageClick(p)}
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
          onClick={handleNext}
          disabled={page === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

