import { Router } from "express"
import { authenticate } from "../middlewares/auth.middleware.js"
import {
  cancelRequest,
  listConnections,
  listIncomingRequests,
  listOutgoingRequests,
  respondToRequest,
  sendConnectionRequest,
} from "../controllers/connection.controller.js"

const router = Router()

router.use(authenticate)

router.get("/", listConnections)
router.get("/incoming", listIncomingRequests)
router.get("/outgoing", listOutgoingRequests)
router.post("/send/:receiverId", sendConnectionRequest)
router.post("/respond/:id", respondToRequest)
router.delete("/cancel/:id", cancelRequest)

export default router

