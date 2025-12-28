import React from "react";
import EditPublicationDialog from "./PublicationTable/EditPublicationDialog";
import EditBookChapterDialog from "./PublicationTable/EditBookChapterDialog";
import EditConferencePaperDialog from "./PublicationTable/EditConferencePaperDialog";

export default function PublicationEditDialogs({
  // Paper dialog
  editPaperOpen = false,
  onEditPaperOpenChange,
  editingPaper,
  onUpdatePaper,
  isUpdatingPaper = false,
  // Chapter dialog
  editChapterOpen = false,
  onEditChapterOpenChange,
  editingChapter,
  onUpdateChapter,
  isUpdatingChapter = false,
  // Conference dialog
  editConferenceOpen = false,
  onEditConferenceOpenChange,
  editingConference,
  onUpdateConference,
  isUpdatingConference = false,
}) {
  return (
    <>
      {editingPaper && (
        <EditPublicationDialog
          paper={editingPaper}
          isOpen={editPaperOpen}
          onClose={() => onEditPaperOpenChange(false)}
          onSave={onUpdatePaper}
          isSaving={isUpdatingPaper}
        />
      )}

      {editingChapter && (
        <EditBookChapterDialog
          open={editChapterOpen}
          onOpenChange={onEditChapterOpenChange}
          chapter={editingChapter}
          onSave={onUpdateChapter}
          isSubmitting={isUpdatingChapter}
        />
      )}

      {editingConference && (
        <EditConferencePaperDialog
          open={editConferenceOpen}
          onOpenChange={onEditConferenceOpenChange}
          paper={editingConference}
          onSave={onUpdateConference}
          isSubmitting={isUpdatingConference}
        />
      )}
    </>
  );
}

