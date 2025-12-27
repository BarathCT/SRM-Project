import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils"; // optional; remove if you don't use it

/**
 * StatsCard
 * Clean, professional white/blue statistic card.
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
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-gray-600 text-sm font-medium truncate">{title}</p>

            {loading ? (
              <Skeleton className="mt-2 h-8 w-24" />
            ) : (
              <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            )}

            {subtitle && (
              <p className="text-blue-600 text-xs mt-1 truncate">{subtitle}</p>
            )}
          </div>

          {icon ? (
            <div className="p-3 bg-blue-50 rounded-lg shrink-0">
              {icon}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}