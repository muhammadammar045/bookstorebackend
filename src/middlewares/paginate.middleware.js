import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const paginate = (model, searchForKeyValuePairsInModel) => asyncHandler(async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        // console.log(page)
        // console.log(limit)
        // console.log(`User ID: ${req.user._id}`);

        // the searchForKeyValuePairsInModel is a function that takes the request object and returns an object with key-value pairs to search for in the model, if not provided, it will search for all documents . In my case i had used req.user._id to search for the user id in the model
        const keyValues = searchForKeyValuePairsInModel ? searchForKeyValuePairsInModel(req) : {};


        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const totalDocuments = await model
            .find(keyValues)
            .countDocuments()
            .exec();
        const totalPages = Math
            .ceil(totalDocuments / limit);

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

        result.results = await model
            .find(keyValues)
            .limit(limit)
            .skip(startIndex);

        res.paginatedResult = result;
        next();
    } catch (error) {
        res.status(500).json(new ApiResponse(500, `Server Error: ${error.message}`));
    }
})

export default paginate;
