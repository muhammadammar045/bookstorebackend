const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next);
        } catch (error) {
            const { code = 500, message, details, stack } = error;

            const response = {
                message,
                success: false,
                // stack: stack,
                ...(process.env.NODE_ENV === 'development' && { details, stack })
            };

            res.status(code).json(response);
        }
    };
};

export default asyncHandler;
