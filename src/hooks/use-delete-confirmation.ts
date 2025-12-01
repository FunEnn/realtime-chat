import { useState } from "react";

interface UseDeleteConfirmationReturn {
  showDeleteConfirm: boolean;
  isDeleting: boolean;
  setIsDeleting: (value: boolean) => void;
  showConfirmDialog: () => void;
  hideConfirmDialog: () => void;
  resetDeleteState: () => void;
}

export const useDeleteConfirmation = (): UseDeleteConfirmationReturn => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const showConfirmDialog = () => setShowDeleteConfirm(true);
  const hideConfirmDialog = () => setShowDeleteConfirm(false);
  const resetDeleteState = () => {
    setShowDeleteConfirm(false);
    setIsDeleting(false);
  };

  return {
    showDeleteConfirm,
    isDeleting,
    setIsDeleting,
    showConfirmDialog,
    hideConfirmDialog,
    resetDeleteState,
  };
};
