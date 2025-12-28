import React from "react";
import { FileText, BookOpen, Presentation } from "lucide-react";
import StatsCard from "./StatsCard";

export default function PublicationStatsCards({
  stats = {},
  loading = {},
  className = "",
}) {
  const { papers = 0, chapters = 0, conference = 0 } = stats;
  const { papers: loadingPapers = false, chapters: loadingChapters = false, conference: loadingConference = false } = loading;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 ${className}`}>
      <StatsCard
        title="Research Papers"
        value={papers}
        subtitle="Journal publications"
        icon={<FileText className="h-8 w-8 text-blue-600" />}
        loading={loadingPapers}
      />
      <StatsCard
        title="Book Chapters"
        value={chapters}
        subtitle="Book contributions"
        icon={<BookOpen className="h-8 w-8 text-green-600" />}
        loading={loadingChapters}
      />
      <StatsCard
        title="Conference Papers"
        value={conference}
        subtitle="Conference presentations"
        icon={<Presentation className="h-8 w-8 text-purple-600" />}
        loading={loadingConference}
        className="sm:col-span-2 lg:col-span-1"
      />
    </div>
  );
}

