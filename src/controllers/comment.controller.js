import { Comment } from "../models/comment.model.js"
import { Post } from "../models/post.model.js"
import { isValidObjectId } from "../utils/objectId.js"

export const addComment = async (req, res) => {
  try {
    const { postId } = req.params
    const { content } = req.body
    if (!isValidObjectId(postId)) return res.status(400).json({ message: "Invalid post id" })
    if (!content) return res.status(400).json({ message: "content is required" })

    const post = await Post.findById(postId).select("_id")
    if (!post) return res.status(404).json({ message: "Post not found" })

    const comment = await Comment.create({
      post: postId,
      user: req.user._id,
      content,
    })

    const populated = await Comment.findById(comment._id).populate("user", "name email role profilePicture")
    return res.status(201).json({ comment: populated })
  } catch (err) {
    console.error("Add comment error", err)
    return res.status(500).json({ message: "Failed to add comment" })
  }
}

export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params
    if (!isValidObjectId(postId)) return res.status(400).json({ message: "Invalid post id" })

    const comments = await Comment.find({ post: postId })
      .populate("user", "name email role profilePicture")
      .sort({ createdAt: -1 })

    return res.status(200).json({ comments })
  } catch (err) {
    console.error("Get comments error", err)
    return res.status(500).json({ message: "Failed to fetch comments" })
  }
}

export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid comment id" })

    const comment = await Comment.findById(id)
    if (!comment) return res.status(404).json({ message: "Comment not found" })

    const isOwner = String(comment.user) === String(req.user._id)
    const isAdmin = req.user.role === "admin"
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not allowed" })

    await Comment.findByIdAndDelete(id)
    return res.status(200).json({ message: "Comment deleted" })
  } catch (err) {
    console.error("Delete comment error", err)
    return res.status(500).json({ message: "Failed to delete comment" })
  }
}

