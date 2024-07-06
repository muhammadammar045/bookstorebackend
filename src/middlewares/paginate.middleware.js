import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const paginate = (model) => asyncHandler(async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 3;

        // console.log(page)
        // console.log(limit)
        // console.log(`User ID: ${req.user._id}`);


        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const totalDocuments = await model.countDocuments().exec();
        const totalPages = Math.ceil(totalDocuments / limit);

        const result = {
            meta: {
                totalDocuments,
                page,
                limit,
                totalPages
            },
        };

        if (endIndex < totalDocuments) {
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

        result.results = await model.find().limit(limit).skip(startIndex);

        res.paginatedResult = result;
        next();
    } catch (error) {
        res.status(500).json(new ApiResponse(500, `Server Error: ${error.message}`));
    }
})

export default paginate;
