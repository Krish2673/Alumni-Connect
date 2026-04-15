import { Router } from "express"
import { authenticate } from "../middlewares/auth.middleware.js"
import { uploadProfileImage } from "../middlewares/upload.middleware.js"
import {
  getMe,
  getUserById,
  getUsers,
  updateMe,
  uploadProfilePicture,
} from "../controllers/user.controller.js"

const router = Router()

router.use(authenticate)

router.get("/me", getMe)
router.patch("/me", updateMe)
router.post("/me/profile-picture", (req, res, next) => {
  uploadProfileImage.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Failed to upload file" })
    }
    next()
  })
}, uploadProfilePicture)
router.get("/", getUsers)
router.get("/:id", getUserById)

export default router

