import cookieParser from "cookie-parser"
import express from "express"
import cors from "cors"
import dashboardRoutes from "./routes/dashboard.routes.js"
import productsRoutes from "./routes/product/product.routes.js"
import userRoutes from "./routes/user.routes.js"
import rolesRoutes from "./routes/roles.routes.js"
import permissionsRoutes from "./routes/permissions.routes.js"
import productVariantsRoutes from "./routes/product/productVariants.routes.js"
import categoryRoutes from "./routes/category.routes.js"
import likeRoutes from "./routes/like.routes.js"
import reviewRoutes from "./routes/product/review.routes.js"
import ratingRoutes from "./routes/rating.routes.js"

const app = express()

app.use(cookieParser())
app.use(express.static("public"))
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))
app.use(express.json({
    limit: "16kb"
}))
app.use(express.urlencoded({
    limit: "16kb",
    extended: true
}))


app.use("/api/v1/dashboard", dashboardRoutes)
app.use("/api/v1/user", userRoutes)
app.use("/api/v1/roles", rolesRoutes)
app.use("/api/v1/permissions", permissionsRoutes)
app.use("/api/v1/categories", categoryRoutes)
app.use("/api/v1/products", productsRoutes)
app.use("/api/v1/product-variants", productVariantsRoutes)
app.use("/api/v1/likes", likeRoutes)
app.use("/api/v1/ratings", ratingRoutes)
app.use("/api/v1/reviews", reviewRoutes)

app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    // Log the error (use a more robust logger in production, e.g., Winston)
    console.error(`Error occurred: ${err.message}`);
    const errorResponse = {
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };
    res.status(statusCode).json(errorResponse);
});

app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "The Requested Url Does Not Exist"
    });
});
export default app