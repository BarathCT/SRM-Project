import { useState, useCallback } from 'react';

/**
 * Custom hook for managing expanded/collapsed state
 * Useful for accordion-like UI elements
 */
export function useExpandedState(initialIndex = null) {
  const [expandedIndex, setExpandedIndex] = useState(initialIndex);

  const toggleExpand = useCallback((index) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  const expand = useCallback((index) => {
    setExpandedIndex(index);
  }, []);

  const collapse = useCallback(() => {
    setExpandedIndex(null);
  }, []);

  return {
    expandedIndex,
    toggleExpand,
    expand,
    collapse,
    setExpandedIndex,
  };
}

