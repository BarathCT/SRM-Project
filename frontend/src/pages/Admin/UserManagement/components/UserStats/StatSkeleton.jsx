import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

const StatSkeleton = () => (
  <div className="space-y-6">
    {/* Header skeleton - minimal and clean */}
    <div className="bg-white border-b border-gray-200 p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
    {/* Content skeleton */}
    <div className="p-6 space-y-6 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-64 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default StatSkeleton;