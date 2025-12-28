import { useState, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '@/components/Toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
      await axios.delete(`${API_BASE_URL}/api/${endpoint}/${id}`, {
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

