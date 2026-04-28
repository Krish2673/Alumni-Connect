import { User } from "../models/user.model.js"
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js"

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
}

export const register = async (req, res) => {
  try {
    const { name, email, password, role, batch, branch, company, linkedIn } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" })
    }
    if ((role === "student" || role === "alumni") && !linkedIn) {
      return res.status(400).json({ message: "LinkedIn is required for students and alumni" })
    }

    const emailNorm = String(email).trim().toLowerCase()
    const existing = await User.findOne({ email: emailNorm })
    if (existing) {
      return res.status(409).json({ message: "User with this email already exists" })
    }

    await User.create({
      name,
      email: emailNorm,
      password,
      role,
      verificationStatus: role === "alumni" ? "pending" : undefined,
      batch,
      branch,
      company: role === "alumni" ? company : undefined,
      linkedIn: role === "student" || role === "alumni" ? String(linkedIn).trim() : undefined,
    })

    return res.status(201).json({
      message: "Account created successfully. Please log in.",
    })
  } catch (err) {
    console.error("Register error", err)
    return res.status(500).json({ message: "Failed to register user" })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const emailNorm = String(email).trim().toLowerCase()
    const user = await User.findOne({ email: emailNorm }).select("+password +refreshToken")
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const isMatch = await user.comparePasswd(password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    const safeUser = await User.findById(user._id).select("-password -refreshToken")

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({ user: safeUser, accessToken })
  } catch (err) {
    console.error("Login error", err)
    return res.status(500).json({ message: "Failed to login" })
  }
}

export const logout = async (req, res) => {
  try {
    if (req.user?._id) {
      await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } },
        { new: true }
      )
    }

    return res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json({ message: "Logged out successfully" })
  } catch (err) {
    console.error("Logout error", err)
    return res.status(500).json({ message: "Failed to logout" })
  }
}

export const me = async (req, res) => {
  return res.status(200).json({ user: req.user })
}

export const refresh = async (req, res) => {
  try {
    const incomingToken = req.cookies?.refreshToken || req.body.refreshToken
    if (!incomingToken) {
      return res.status(401).json({ message: "Refresh token missing" })
    }

    const decoded = verifyRefreshToken(incomingToken)
    const user = await User.findById(decoded._id).select("+refreshToken")
    if (!user || user.refreshToken !== incomingToken) {
      return res.status(401).json({ message: "Invalid refresh token" })
    }

    const accessToken = generateAccessToken(user._id)
    const newRefreshToken = generateRefreshToken(user._id)
    user.refreshToken = newRefreshToken
    await user.save({ validateBeforeSave: false })

    const safeUser = await User.findById(user._id).select("-password -refreshToken")

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json({ user: safeUser, accessToken })
  } catch (err) {
    console.error("Refresh token error", err)
    return res.status(401).json({ message: "Invalid or expired refresh token" })
  }
}

