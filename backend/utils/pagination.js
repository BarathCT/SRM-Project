/**
 * Pagination utility for standardized server-side pagination
 */

/**
 * Parse pagination parameters from request query
 * @param {object} query - Request query object
 * @param {number} defaultLimit - Default items per page (default: 15)
 * @param {number} maxLimit - Maximum items per page (default: 100)
 * @returns {object} { page, limit, skip }
 */
export const getPaginationParams = (query, defaultLimit = 0, maxLimit = 0) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/**
 * Build paginated response
 * @param {array} data - Query results
 * @param {number} total - Total count of documents
 * @param {object} pagination - { page, limit }
 * @returns {object} Standardized paginated response
 */
export const buildPaginatedResponse = (data, total, { page, limit }) => ({
    data,
    pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
    }
});
