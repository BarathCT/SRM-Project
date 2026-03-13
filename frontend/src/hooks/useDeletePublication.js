import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/Toast';



/**
 * Custom hook for handling publication deletion
 * Supports papers, book-chapters, and conference-papers
 */
export function useDeletePublication({
  endpoint, // 'papers', 'book-chapters', or 'conference-papers'
  onSuccess, // Callback after successful deletion
  successMessage = 'Publication deleted',
  errorMessage = 'Delete failed',
}) {
  const [deletingId, setDeletingId] = useState(null);
  const { toast } = useToast();

  const deletePublication = useCallback(async (id) => {
    setDeletingId(id);
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/${endpoint}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (onSuccess) {
        onSuccess(id);
      }
      
      toast.success(successMessage);
    } catch (error) {
      toast.error(errorMessage);
      console.error(`Failed to delete ${endpoint}:`, error);
    } finally {
      setDeletingId(null);
    }
  }, [endpoint, onSuccess, successMessage, errorMessage, toast]);

  return {
    deletingId,
    deletePublication,
  };
}

