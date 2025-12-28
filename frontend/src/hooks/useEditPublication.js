import { useState, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '@/components/Toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
      const response = await axios.put(`${API_BASE_URL}/api/${endpoint}/${data._id}`, data, {
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

