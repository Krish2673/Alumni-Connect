import mongoose from "mongoose"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is Required"],
      minLength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "alumni", "admin"],
      required: true,
    },
    // Alumni accounts require admin verification before they are allowed to post.
    // Admin-approved: "verified", otherwise "pending".
    verificationStatus: {
      type: String,
      enum: ["pending", "verified"],
      default: function () {
        if (this.role === "alumni") return "pending"
        return undefined
      },
    },
    batch: Number,
    branch: String,
    profilePicture: String, // Cloudinary URL
    bio: String,
    company: {
      type: String,
      required: function () {
        return this.role === "alumni"
      },
    },
    skills: [String],
    linkedIn: String,
    github: String,
    refreshToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
)

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return
  this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.comparePasswd = async function (password) {
  return await bcrypt.compare(password, this.password)
}

export const User = mongoose.model("User", userSchema)