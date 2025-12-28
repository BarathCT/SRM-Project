/**
 * Pagination utility for standardized pagination across all routes
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 100;

/**
 * Parse pagination parameters from query string
 * @param {Object} query - Request query object
 * @returns {Object} - Parsed pagination parameters
 */
export const parsePaginationParams = (query) => {
    let page = parseInt(query.page, 10);
    let limit = parseInt(query.limit, 10);

    // Validate and set defaults
    page = Number.isNaN(page) || page < 1 ? DEFAULT_PAGE : page;
    limit = Number.isNaN(limit) || limit < 1 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);

    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

/**
 * Parse sorting parameters from query string
 * @param {Object} query - Request query object
 * @param {Array} allowedFields - Fields that can be sorted
 * @returns {Object} - MongoDB sort object
 */
export const parseSortParams = (query, allowedFields = ['createdAt', 'year', 'title']) => {
    const sortBy = allowedFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    return { [sortBy]: sortOrder };
};

/**
 * Parse filter parameters for publications
 * @param {Object} query - Request query object
 * @returns {Object} - MongoDB filter object
 */
export const parsePublicationFilters = (query) => {
    const filter = {};

    // Year filter
    if (query.year) {
        const year = parseInt(query.year, 10);
        if (!Number.isNaN(year)) {
            filter.year = year;
        }
    }

    // Q Rating filter
    if (query.qRating && ['Q1', 'Q2', 'Q3', 'Q4'].includes(query.qRating)) {
        filter.qRating = query.qRating;
    }

    // Publication type filter
    if (query.publicationType && ['scopus', 'sci', 'webOfScience'].includes(query.publicationType)) {
        filter.publicationType = query.publicationType;
    }

    // Subject area filter
    if (query.subjectArea) {
        filter.subjectArea = query.subjectArea;
    }

    // Text search (title, journal)
    if (query.search && query.search.trim()) {
        const searchTerm = query.search.trim();
        filter.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
            { journal: { $regex: searchTerm, $options: 'i' } },
            { 'authors.name': { $regex: searchTerm, $options: 'i' } }
        ];
    }

    return filter;
};

/**
 * Parse filter parameters for users
 * @param {Object} query - Request query object
 * @returns {Object} - MongoDB filter object
 */
export const parseUserFilters = (query) => {
    const filter = {};

    // Role filter
    if (query.role && ['super_admin', 'campus_admin', 'faculty'].includes(query.role)) {
        filter.role = query.role;
    }

    // College filter
    if (query.college) {
        filter.college = query.college;
    }

    // Institute filter
    if (query.institute) {
        filter.institute = query.institute;
    }

    // Department filter
    if (query.department) {
        filter.department = query.department;
    }

    // Active status filter
    if (query.isActive !== undefined) {
        filter.isActive = query.isActive === 'true';
    }

    // Text search (fullName, email, facultyId)
    if (query.search && query.search.trim()) {
        const searchTerm = query.search.trim();
        filter.$or = [
            { fullName: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } },
            { facultyId: { $regex: searchTerm, $options: 'i' } }
        ];
    }

    return filter;
};

/**
 * Build paginated response with metadata
 * @param {Array} data - Array of documents
 * @param {number} total - Total count of documents matching filter
 * @param {Object} paginationParams - Parsed pagination parameters
 * @returns {Object} - Paginated response object
 */
export const buildPaginatedResponse = (data, total, paginationParams) => {
    const { page, limit } = paginationParams;
    const totalPages = Math.ceil(total / limit);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
};

/**
 * Apply pagination to a Mongoose query
 * @param {Object} query - Mongoose query object
 * @param {Object} paginationParams - Parsed pagination parameters
 * @param {Object} sortParams - Parsed sort parameters
 * @returns {Object} - Modified query
 */
export const applyPagination = (query, paginationParams, sortParams) => {
    return query
        .sort(sortParams)
        .skip(paginationParams.skip)
        .limit(paginationParams.limit);
};

export default {
    parsePaginationParams,
    parseSortParams,
    parsePublicationFilters,
    parseUserFilters,
    buildPaginatedResponse,
    applyPagination,
    DEFAULT_PAGE,
    DEFAULT_LIMIT,
    MAX_LIMIT
};
