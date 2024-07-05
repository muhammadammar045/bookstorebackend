import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const paginate = (model) => asyncHandler(async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 3;

        console.log(`Pagination middleware executing for user ID: ${req.user._id}`);
        console.log(`Requested page: ${page}, limit: ${limit}`);

        const startIndex = (page - 1) * limit;

        // Find books belonging to the current user
        const userBooks = await model.find({ owner: req.user._id });

        const totalDocuments = userBooks.length;
        const totalPages = Math.ceil(totalDocuments / limit);

        console.log(`Total documents for user ID ${req.user._id}: ${totalDocuments}`);

        const result = {
            meta: {
                totalDocuments,
                page,
                limit,
                totalPages
            },
        };

        if (startIndex < totalDocuments) {
            result.meta.next = {
                page: page + 1,
                limit,
            };
        }

        if (startIndex > 0) {
            result.meta.previous = {
                page: page - 1,
                limit,
            };
        }

        // Apply pagination to userBooks array
        result.results = userBooks.slice(startIndex, startIndex + limit);

        console.log(`Returned results for user ID ${req.user._id}: ${result.results.length}`);

        res.paginatedResult = result;
        next();
    } catch (error) {
        console.error(`Pagination error for user ID ${req.user._id}: ${error.message}`);
        res.status(500).json(new ApiResponse(500, `Server Error: ${error.message}`));
    }
});

export default paginate;
