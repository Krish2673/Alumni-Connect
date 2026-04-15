import mongoose from "mongoose"

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    postType: {
      type: String,
      enum: ["opportunity", "event", "general"],
      required: true,
    },
    image: String, // Cloudinary URL
  },
  { timestamps: true }
)

export const Post = mongoose.model("Post", postSchema)