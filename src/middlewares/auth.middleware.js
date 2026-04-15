import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    const token =
      (header && header.startsWith("Bearer ") && header.split(" ")[1]) ||
      req.cookies?.accessToken

    if (!token) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded._id).select("-password -refreshToken")
    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: "You are not allowed to perform this action" })
    }
    next()
  }
}

