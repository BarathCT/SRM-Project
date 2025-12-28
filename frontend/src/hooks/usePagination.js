import { useState, useCallback, useRef, useEffect } from 'react';
import api from '@/lib/api';

/**
 * Custom hook for server-side pagination
 * @param {string} endpoint - API endpoint
 * @param {object} options - Configuration options
 * @returns {object} Pagination state and handlers
 */
export function usePagination(endpoint, options = {}) {
    const {
        defaultLimit = 15,
        defaultParams = {},
        autoFetch = false,
        onError
    } = options;

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: defaultLimit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);
    const isMountedRef = useRef(true);

    const fetchData = useCallback(async (page = 1, params = {}) => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await api.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page,
                    limit: pagination.limit,
                    ...defaultParams,
                    ...params
                },
                signal: abortControllerRef.current.signal
            });

            if (!isMountedRef.current) return;

            const result = response.data;

            // Handle both paginated and non-paginated responses for backward compatibility
            if (result.pagination) {
                setData(result.data || []);
                setPagination(prev => ({
                    ...prev,
                    ...result.pagination
                }));
            } else if (Array.isArray(result)) {
                // Legacy response format (array)
                setData(result);
                setPagination(prev => ({
                    ...prev,
                    total: result.length,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                }));
            }

            return result;
        } catch (err) {
            if (err.name === 'CanceledError' || err.name === 'AbortError') return;
            if (!isMountedRef.current) return;

            setError(err);
            onError?.(err);
            console.error('Pagination fetch error:', err);
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [endpoint, pagination.limit, defaultParams, onError]);

    const goToPage = useCallback((page) => {
        if (page >= 1 && page <= pagination.totalPages) {
            fetchData(page);
        }
    }, [fetchData, pagination.totalPages]);

    const nextPage = useCallback(() => {
        if (pagination.hasNextPage) {
            goToPage(pagination.page + 1);
        }
    }, [pagination.hasNextPage, pagination.page, goToPage]);

    const prevPage = useCallback(() => {
        if (pagination.hasPrevPage) {
            goToPage(pagination.page - 1);
        }
    }, [pagination.hasPrevPage, pagination.page, goToPage]);

    const setLimit = useCallback((limit) => {
        setPagination(prev => ({ ...prev, limit, page: 1 }));
    }, []);

    const refresh = useCallback((params = {}) => {
        return fetchData(pagination.page, params);
    }, [fetchData, pagination.page]);

    const reset = useCallback(() => {
        setData([]);
        setPagination(prev => ({
            ...prev,
            page: 1,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
        }));
    }, []);

    // Auto fetch on mount if enabled
    useEffect(() => {
        if (autoFetch) {
            fetchData(1);
        }
    }, [autoFetch]); // Only run on mount when autoFetch is true

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        data,
        loading,
        error,
        pagination,
        fetchData,
        goToPage,
        nextPage,
        prevPage,
        setLimit,
        refresh,
        reset,
        setData
    };
}
