import { User } from "../models/user.model.js"
import { cloudinary, configureCloudinary } from "../utils/cloudinary.js"

export const getMe = async (req, res) => {
  return res.status(200).json({ user: req.user })
}

export const updateMe = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "batch",
      "branch",
      "bio",
      "company",
      "skills",
      "linkedIn",
      "github",
    ]

    const updates = {}
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    })

    const updated = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
      select: "-password -refreshToken",
    })

    return res.status(200).json({ user: updated })
  } catch (err) {
    console.error("Update profile error", err)
    return res.status(500).json({ message: "Failed to update profile" })
  }
}

export const uploadProfilePicture = async (req, res) => {
  try {
    if (!configureCloudinary()) {
      return res.status(503).json({
        message: "Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      })
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ message: "No image file provided" })
    }

    const mime = req.file.mimetype || "image/jpeg"
    if (!mime.startsWith("image/")) {
      return res.status(400).json({ message: "Only image files are allowed" })
    }

    const dataUri = `data:${mime};base64,${req.file.buffer.toString("base64")}`
    const uploaded = await cloudinary.uploader.upload(dataUri, {
      folder: "alumni_connect/profiles",
      resource_type: "image",
    })

    const url = uploaded.secure_url
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: url },
      { new: true, runValidators: true, select: "-password -refreshToken" }
    )

    return res.status(200).json({ user: updated })
  } catch (err) {
    console.error("Upload profile picture error", err)
    return res.status(500).json({ message: err.message || "Failed to upload profile picture" })
  }
}

export const getUsers = async (req, res) => {
  try {
    const { role, batch, branch, company, skills, search, excludeMe } = req.query
    const filter = {}
    const normalizedRole = role ? String(role).trim().toLowerCase() : ""

    if (normalizedRole) filter.role = normalizedRole
    if (normalizedRole === "alumni") filter.verificationStatus = "verified"
    if (batch) filter.batch = Number(batch)
    if (branch) filter.branch = { $regex: String(branch).trim(), $options: "i" }
    if (company) filter.company = { $regex: String(company).trim(), $options: "i" }
    if (excludeMe === "true") filter._id = { $ne: req.user._id }

    if (skills) {
      const skillsList = String(skills)
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)

      if (skillsList.length > 0) {
        filter.skills = {
          $all: skillsList.map((skill) => ({ $regex: skill, $options: "i" })),
        }
      }
    }

    if (search) {
      const searchRegex = { $regex: String(search).trim(), $options: "i" }
      filter.$or = [
        { name: searchRegex },
        { skills: searchRegex },
        { company: searchRegex },
        { branch: searchRegex },
      ]
    }

    const users = await User.find(filter)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })

    return res.status(200).json({ users })
  } catch (err) {
    console.error("Get users error", err)
    return res.status(500).json({ message: "Failed to fetch users" })
  }
}

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -refreshToken")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    return res.status(200).json({ user })
  } catch (err) {
    console.error("Get user by id error", err)
    return res.status(500).json({ message: "Failed to fetch user" })
  }
}

