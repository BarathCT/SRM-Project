import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/Toast';



/**
 * Custom hook for handling publication editing
 * Supports papers, book-chapters, and conference-papers
 */
export function useEditPublication({
  endpoint, // 'papers', 'book-chapters', or 'conference-papers'
  onSuccess, // Callback after successful update: (updatedData) => void
  successMessage = 'Publication updated',
  errorMessage = 'Update failed',
}) {
  const [editing, setEditing] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const startEdit = useCallback((item) => {
    setEditing(item);
    setIsOpen(true);
  }, []);

  const closeEdit = useCallback(() => {
    if (!isUpdating) {
      setIsOpen(false);
      setEditing(null);
    }
  }, [isUpdating]);

  const updatePublication = useCallback(async (data) => {
    if (!data || !data._id) return;
    
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.put(`/${endpoint}/${data._id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const updatedData = response.data || data;
      
      if (onSuccess) {
        onSuccess(updatedData);
      }
      
      setIsOpen(false);
      setEditing(null);
      toast.success(successMessage);
    } catch (error) {
      const errorMsg = error.response?.data?.error || errorMessage;
      toast.error(errorMsg);
      console.error(`Failed to update ${endpoint}:`, error);
    } finally {
      setIsUpdating(false);
    }
  }, [endpoint, onSuccess, successMessage, errorMessage, toast]);

  return {
    editing,
    isOpen,
    isUpdating,
    startEdit,
    closeEdit,
    updatePublication,
    setIsOpen,
  };
}

