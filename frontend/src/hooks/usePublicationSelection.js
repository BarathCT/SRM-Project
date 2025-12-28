import { useState, useCallback } from 'react';

/**
 * Custom hook for managing publication selection state
 * Handles selection for papers, chapters, and conference papers
 */
export function usePublicationSelection(initialData = []) {
  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const toggleSelectAll = useCallback((data = initialData) => {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(new Set(data.map((item) => item._id)));
      setSelectAll(true);
    }
  }, [selectAll, initialData]);

  const toggleSelect = useCallback((id, data = initialData) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setSelectAll(next.size === data.length && data.length > 0);
      return next;
    });
  }, [initialData]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
    setSelectAll(false);
  }, []);

  const removeFromSelection = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return {
    selected,
    selectAll,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
    removeFromSelection,
    setSelected,
    setSelectAll,
  };
}

