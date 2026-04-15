import { Like } from "../models/like.model.js"
import { Post } from "../models/post.model.js"
import { isValidObjectId } from "../utils/objectId.js"

export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params
    if (!isValidObjectId(postId)) return res.status(400).json({ message: "Invalid post id" })

    const post = await Post.findById(postId).select("_id")
    if (!post) return res.status(404).json({ message: "Post not found" })

    const existing = await Like.findOne({ post: postId, user: req.user._id })
    if (existing) {
      await Like.findByIdAndDelete(existing._id)
      const count = await Like.countDocuments({ post: postId })
      return res.status(200).json({ liked: false, likeCount: count })
    }

    await Like.create({ post: postId, user: req.user._id })
    const count = await Like.countDocuments({ post: postId })
    return res.status(200).json({ liked: true, likeCount: count })
  } catch (err) {
    if (err?.code === 11000) {
      const count = await Like.countDocuments({ post: req.params.postId })
      return res.status(200).json({ liked: true, likeCount: count })
    }
    console.error("Toggle like error", err)
    return res.status(500).json({ message: "Failed to toggle like" })
  }
}

export const getLikeStatus = async (req, res) => {
  try {
    const { postId } = req.params
    if (!isValidObjectId(postId)) return res.status(400).json({ message: "Invalid post id" })

    const [liked, count] = await Promise.all([
      Like.findOne({ post: postId, user: req.user._id }),
      Like.countDocuments({ post: postId }),
    ])

    return res.status(200).json({ liked: Boolean(liked), likeCount: count })
  } catch (err) {
    console.error("Like status error", err)
    return res.status(500).json({ message: "Failed to fetch like status" })
  }
}

