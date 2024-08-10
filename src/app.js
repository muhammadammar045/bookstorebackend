import cookieParser from "cookie-parser"
import express from "express"
import cors from "cors"
import booksRoutes from "./routes/books.routes.js"
import productsRoutes from "./routes/product.routes.js"
import userRoutes from "./routes/user.routes.js"
import rolesRoutes from "./routes/roles.routes.js"
import permissionsRoutes from "./routes/permissions.routes.js"
import categoryRoutes from "./routes/category.routes.js"
import likeRoutes from "./routes/like.routes.js"
import commentRoutes from "./routes/comment.routes.js"
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


app.use("/api/v1/books", booksRoutes)
app.use("/api/v1/user", userRoutes)
app.use("/api/v1/roles", rolesRoutes)
app.use("/api/v1/permissions", permissionsRoutes)
app.use("/api/v1/category", categoryRoutes)
app.use("/api/v1/products", productsRoutes)
app.use("/api/v1/like", likeRoutes)
app.use("/api/v1/rating", ratingRoutes)
app.use("/api/v1/comment", commentRoutes)


export default app