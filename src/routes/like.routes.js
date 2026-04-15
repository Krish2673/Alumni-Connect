import { Router } from "express"
import { authenticate } from "../middlewares/auth.middleware.js"
import { getLikeStatus, toggleLike } from "../controllers/like.controller.js"

const router = Router()

router.use(authenticate)

router.get("/post/:postId", getLikeStatus)
router.post("/post/:postId/toggle", toggleLike)

export default router

