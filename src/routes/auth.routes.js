import { Router } from "express"
import { authenticate } from "../middlewares/auth.middleware.js"
import { login, logout, me, refresh, register } from "../controllers/auth.controller.js"

const router = Router()

router.post("/register", register)
router.post("/login", login)
router.post("/logout", authenticate, logout)
router.get("/me", authenticate, me)
router.post("/refresh-token", refresh)

export default router

