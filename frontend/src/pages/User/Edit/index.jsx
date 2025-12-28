import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadResearchPage from "../Upload/UploadResearchPage";
import UploadConferencePage from "../Upload/UploadConferencePage";
import UploadBookChapterPage from "../Upload/UploadBookChapterPage";

const PUBLICATION_TYPE_MAP = {
  research: {
    label: "Research Paper",
    component: UploadResearchPage,
  },
  conference: {
    label: "Conference Paper",
    component: UploadConferencePage,
  },
  "book-chapter": {
    label: "Book Chapter",
    component: UploadBookChapterPage,
  },
};

export default function EditSelector() {
  const navigate = useNavigate();
  const location = useLocation();
  const { type, id } = useParams();
  
  // Get publication data from location state
  const publication = location.state?.publication;
  
  // Detect publication type from data structure if not provided in URL
  const detectPublicationType = (pub) => {
    if (!pub) return "research";
    
    // If type is explicitly provided in URL, use it
    if (type) return type;
    
    // Check for conference paper indicators
    if (pub.conferenceName || pub.conferenceType || pub.conferenceMode) {
      return "conference";
    }
    
    // Check for book chapter indicators
    if (pub.chapterTitle || pub.bookTitle) {
      return "book-chapter";
    }
    
    // Check publicationType field for research papers
    if (pub.publicationType) {
      // Map scopus/sci/webOfScience to research
      if (['scopus', 'sci', 'webOfScience', 'research'].includes(pub.publicationType)) {
        return "research";
      }
    }
    
    // Default to research paper
    return "research";
  };

  const publicationType = detectPublicationType(publication);
  const selectedOption = PUBLICATION_TYPE_MAP[publicationType] || PUBLICATION_TYPE_MAP.research;
  const EditComponent = selectedOption.component;

  if (!publication) {
    // If no publication data, redirect back
    navigate(-1);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-9 w-9 hover:bg-gray-100 text-gray-700 flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Edit {selectedOption.label}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Update your publication details
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="transition-all duration-300 ease-in-out">
          <EditComponent embedded={true} editMode={true} initialData={publication} />
        </div>
      </div>
    </div>
  );
}

