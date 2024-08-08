import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const paginate = (model, options = {}) => asyncHandler(async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = {},
            select = {},
            populate = [],
            populateSelect = "",
            query = {},
        } = req.query;

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const totalDocuments = await model.countDocuments(query);
        const totalPages = Math.ceil(totalDocuments / limit);

        const results = await model
            .find(query)
            .sort(sort)
            .select(select)
            .populate(populate, populateSelect)
            .skip(startIndex)
            .limit(limit);

        const paginatedResponse = {
            success: true,
            count: results.length,
            totalDocuments,
            totalPages,
            currentPage: page,
            pageSize: limit,
            data: results,
        };

        if (endIndex < totalDocuments) {
            paginatedResponse.next = {
                page: page + 1,
                limit,
            };
        }

        if (startIndex > 0) {
            paginatedResponse.previous = {
                page: page - 1,
                limit,
            };
        }

        res.paginatedResponse = paginatedResponse;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json(new ApiResponse(500, 'Server Error'));
    }
});

export default paginate;
