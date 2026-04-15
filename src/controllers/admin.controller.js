import { User } from "../models/user.model.js"
import { isValidObjectId } from "../utils/objectId.js"

export const listPendingAlumni = async (req, res) => {
  try {
    const users = await User.find({
      role: "alumni",
      $or: [{ verificationStatus: "pending" }, { verificationStatus: { $exists: false } }, { verificationStatus: null }],
    })
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })

    return res.status(200).json({ users })
  } catch (err) {
    console.error("List pending alumni error", err)
    return res.status(500).json({ message: "Failed to fetch pending alumni" })
  }
}

export const verifyAlumni = async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid user id" })

    const user = await User.findById(id)
    if (!user || user.role !== "alumni") return res.status(404).json({ message: "Alumni not found" })

    user.verificationStatus = "verified"
    await user.save({ validateBeforeSave: false })

    const safeUser = await User.findById(user._id).select("-password -refreshToken")
    return res.status(200).json({ user: safeUser })
  } catch (err) {
    console.error("Verify alumni error", err)
    return res.status(500).json({ message: "Failed to verify alumni" })
  }
}

