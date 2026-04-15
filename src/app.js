import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js"
import postRoutes from "./routes/post.routes.js"
import commentRoutes from "./routes/comment.routes.js"
import likeRoutes from "./routes/like.routes.js"
import connectionRoutes from "./routes/connection.routes.js"
import adminRoutes from "./routes/admin.routes.js"

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  })
)

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ limit: "16kb", extended: true }))
app.use(express.static("public"))
app.use(cookieParser())

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" })
})

app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/posts", postRoutes)
app.use("/api/v1/comments", commentRoutes)
app.use("/api/v1/likes", likeRoutes)
app.use("/api/v1/connections", connectionRoutes)
app.use("/api/v1/admin", adminRoutes)

export default app