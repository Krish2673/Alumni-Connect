import { Router } from "express"
import { authenticate } from "../middlewares/auth.middleware.js"
import {
  createPost,
  deletePost,
  getPostById,
  getPosts,
  updatePost,
} from "../controllers/post.controller.js"

const router = Router()

router.use(authenticate)

router.post("/", createPost)
router.get("/", getPosts)
router.get("/:id", getPostById)
router.patch("/:id", updatePost)
router.delete("/:id", deletePost)

export default router

