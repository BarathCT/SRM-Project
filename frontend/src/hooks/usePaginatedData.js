import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';

/**
 * Custom hook for paginated data fetching with server-side filtering
 * 
 * @param {string} endpoint - API endpoint to fetch data from
 * @param {Object} options - Configuration options
 * @param {Object} options.initialFilters - Initial filter values
 * @param {number} options.initialLimit - Initial page size (default: 15)
 * @param {Object} options.params - Additional query parameters
 * @param {boolean} options.enabled - Whether to enable fetching (default: true)
 * @param {Function} options.transformData - Transform response data
 */
const usePaginatedData = (endpoint, options = {}) => {
    const {
        initialFilters = {},
        initialLimit = 15,
        params = {},
        enabled = true,
        transformData = (data) => data
    } = options;

    // Pagination state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(initialLimit);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Data state
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter state
    const [filters, setFilters] = useState(initialFilters);

    // Abort controller for request cancellation
    const abortControllerRef = useRef(null);

    // Debounce timer for search
    const debounceTimerRef = useRef(null);
    const [debouncedFilters, setDebouncedFilters] = useState(initialFilters);

    // Debounce filter changes
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            setDebouncedFilters(filters);
            setPage(1); // Reset to first page when filters change
        }, 300);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [filters]);

    // Fetch data
    const fetchData = useCallback(async () => {
        if (!enabled) return;

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');

            // Build query parameters
            const queryParams = {
                page,
                limit,
                ...params,
                ...debouncedFilters
            };

            // Remove empty/null/undefined values
            Object.keys(queryParams).forEach(key => {
                if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined || queryParams[key] === 'all') {
                    delete queryParams[key];
                }
            });

            const response = await api.get(endpoint, {
                params: queryParams,
                headers: { Authorization: `Bearer ${token}` },
                signal: abortControllerRef.current.signal
            });

            // Handle paginated response format
            if (response.data?.pagination) {
                const transformedData = transformData(response.data.data);
                setData(transformedData);
                setTotal(response.data.pagination.total);
                setTotalPages(response.data.pagination.totalPages);
            } else {
                // Fallback for non-paginated responses
                const transformedData = transformData(response.data);
                setData(Array.isArray(transformedData) ? transformedData : []);
                setTotal(Array.isArray(transformedData) ? transformedData.length : 0);
                setTotalPages(1);
            }
        } catch (err) {
            if (err.name === 'AbortError' || err.name === 'CanceledError') {
                // Request was cancelled, ignore
                return;
            }
            console.error(`Error fetching ${endpoint}:`, err);
            setError(err.message || 'Failed to fetch data');
            setData([]);
            setTotal(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    }, [endpoint, page, limit, debouncedFilters, params, enabled, transformData]);

    // Fetch data when dependencies change
    useEffect(() => {
        fetchData();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchData]);

    // Update a single filter
    const updateFilter = useCallback((key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    }, []);

    // Update multiple filters at once
    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters
        }));
    }, []);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFilters(initialFilters);
    }, [initialFilters]);

    // Change page
    const goToPage = useCallback((newPage) => {
        setPage(newPage);
    }, []);

    // Change page size
    const changeLimit = useCallback((newLimit) => {
        setLimit(newLimit);
        setPage(1); // Reset to first page
    }, []);

    // Refresh data
    const refresh = useCallback(() => {
        fetchData();
    }, [fetchData]);

    // Check if any filters are active
    const hasActiveFilters = Object.keys(filters).some(key => {
        const value = filters[key];
        return value !== '' && value !== null && value !== undefined && value !== 'all';
    });

    return {
        // Data
        data,
        loading,
        error,

        // Pagination
        page,
        limit,
        total,
        totalPages,
        goToPage,
        changeLimit,

        // Filters
        filters,
        updateFilter,
        updateFilters,
        clearFilters,
        hasActiveFilters,

        // Actions
        refresh
    };
};

export default usePaginatedData;
export { usePaginatedData };
