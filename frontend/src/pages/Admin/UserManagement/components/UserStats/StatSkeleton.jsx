const StatSkeleton = () => (
  <div className="animate-pulse">
    {/* Header skeleton with light blue background */}
    <div className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100 p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-blue-200/50 rounded-xl"></div>
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-blue-200/50 rounded w-3/4"></div>
          <div className="h-4 bg-blue-200/50 rounded w-1/2"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-blue-100/40 rounded-2xl"></div>
        ))}
      </div>
    </div>
    {/* Content skeleton */}
    <div className="p-6 space-y-4 bg-white/95">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="h-96 bg-gray-100/70 rounded-2xl"></div>
        ))}
      </div>
    </div>
  </div>
);

export default StatSkeleton;