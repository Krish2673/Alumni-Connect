import { Router } from "express"
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js"
import { listPendingAlumni, verifyAlumni } from "../controllers/admin.controller.js"

const router = Router()

router.use(authenticate)

router.get("/alumni/pending", authorizeRoles("admin"), listPendingAlumni)
router.post("/alumni/:id/verify", authorizeRoles("admin"), verifyAlumni)

export default router

