import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils"; // optional; remove if you don't use it

/**
 * StatsCard
 * Clean, professional white/blue statistic card.
 * Responsive: Compact on mobile, spacious on desktop.
 *
 * Props:
 * - title: string
 * - value: string | number
 * - subtitle?: string
 * - icon?: React.ReactNode
 * - loading?: boolean
 * - className?: string
 */
export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  loading = false,
  className,
}) {
  return (
    <Card className={cn("border border-gray-200 bg-white", className)}>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
          <div className="min-w-0 flex-1 text-center md:text-left">
            <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">{title}</p>

            {loading ? (
              <Skeleton className="mt-2 h-6 sm:h-8 w-16 sm:w-24 mx-auto md:mx-0" />
            ) : (
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{value}</p>
            )}

            {subtitle && (
              <p className="text-blue-600 text-xs mt-1 truncate hidden md:block">{subtitle}</p>
            )}
          </div>

          {icon ? (
            <div className="hidden lg:block p-2 sm:p-3 bg-blue-50 rounded-lg shrink-0">
              {React.cloneElement(icon, {
                className: cn(icon.props?.className, "h-6 w-6 sm:h-8 sm:w-8")
              })}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}