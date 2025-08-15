import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RefreshCw } from "lucide-react";

const DeleteConfirmationDialog = ({
  trigger, // React element to trigger the dialog
  title = "Delete Item", // Title of the dialog
  description = "This action cannot be undone.", // Description text
  itemName = "", // Name of the item being deleted (optional)
  onConfirm, // Function to call when delete is confirmed
  isDeleting = false, // Boolean to show loading state
  cancelText = "Cancel", // Text for cancel button
  confirmText = "Delete", // Text for confirm button
  confirmButtonClassName = "bg-red-600 hover:bg-red-700", // Custom styling for confirm button
}) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            {description}
            {itemName && (
              <>
                {" "}This will permanently delete "{itemName}".
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-gray-300">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={confirmButtonClassName}
          >
            {isDeleting ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;