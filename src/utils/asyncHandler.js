// const asyncHandler = (requestHandler) => {
//     return (req, res, next) => {
//         Promise
//             .resolve(requestHandler(req, res, next))
//             .catch((error) => next(error))
//     }
// }


//  Both Are Same

const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next)
        } catch (error) {
            res
                .status(error.code || 500)
                .json({
                    message: error.message,
                    success: false
                })
        }
    }
}

export default asyncHandler;
