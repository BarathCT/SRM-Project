import React from "react";
import { FileText, BookOpen, Presentation } from "lucide-react";

const PUB_TABS = [
  { id: "papers", label: "Research Papers", icon: FileText },
  { id: "bookChapters", label: "Book Chapters", icon: BookOpen },
  { id: "conferencePapers", label: "Conference Papers", icon: Presentation },
];

export default function PublicationTabs({ activeTab, onTabChange, counts = {} }) {
  return (
    <div className="mb-4 sm:mb-6 border-b border-gray-200 -mx-2 sm:mx-0 px-2 sm:px-0">
      <nav className="flex gap-1 sm:gap-4 overflow-x-auto scrollbar-hide pb-px">
        {PUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const count = counts[tab.id] || 0;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-colors border-b-2 -mb-px whitespace-nowrap min-h-[44px] ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
              <span className="xs:hidden sm:hidden">{tab.label.split(' ')[0]}</span>
              {count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

