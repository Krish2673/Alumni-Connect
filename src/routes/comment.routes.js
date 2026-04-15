import { Router } from "express"
import { authenticate } from "../middlewares/auth.middleware.js"
import {
  addComment,
  deleteComment,
  getCommentsByPost,
} from "../controllers/comment.controller.js"

const router = Router()

router.use(authenticate)

router.get("/post/:postId", getCommentsByPost)
router.post("/post/:postId", addComment)
router.delete("/:id", deleteComment)

export default router

