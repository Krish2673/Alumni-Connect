import { Post } from "../models/post.model.js"
import { Comment } from "../models/comment.model.js"
import { Like } from "../models/like.model.js"
import { isValidObjectId } from "../utils/objectId.js"

export const createPost = async (req, res) => {
  try {
    const { title, description, postType, image } = req.body
    if (!title || !description || !postType) {
      return res.status(400).json({ message: "title, description and postType are required" })
    }

    if (req.user?.role === "student") {
      return res.status(403).json({ message: "Students cannot create posts" })
    }
    if (req.user?.role === "alumni") {
      if (req.user.verificationStatus !== "verified") {
        return res.status(403).json({ message: "Alumni verification is pending. Cannot create posts yet." })
      }
    }

    const post = await Post.create({
      title,
      description,
      postType,
      image,
      postedBy: req.user._id,
    })

    const populated = await Post.findById(post._id).populate("postedBy", "name email role")
    return res.status(201).json({ post: populated })
  } catch (err) {
    console.error("Create post error", err)
    return res.status(500).json({ message: "Failed to create post" })
  }
}

export const getPosts = async (req, res) => {
  try {
    const { postType, postedBy, q } = req.query
    const filter = {}
    if (postType) filter.postType = postType
    if (postedBy && isValidObjectId(postedBy)) filter.postedBy = postedBy
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ]
    }

    const posts = await Post.find(filter)
      .populate("postedBy", "name email role profilePicture company batch branch")
      .sort({ createdAt: -1 })

    const postIds = posts.map((p) => p._id)
    const [likeCounts, commentCounts, myLikes] = await Promise.all([
      Like.aggregate([{ $match: { post: { $in: postIds } } }, { $group: { _id: "$post", c: { $sum: 1 } } }]),
      Comment.aggregate([{ $match: { post: { $in: postIds } } }, { $group: { _id: "$post", c: { $sum: 1 } } }]),
      Like.find({ user: req.user._id, post: { $in: postIds } }).select("post"),
    ])

    const likeMap = new Map(likeCounts.map((x) => [String(x._id), x.c]))
    const commentMap = new Map(commentCounts.map((x) => [String(x._id), x.c]))
    const myLikeSet = new Set(myLikes.map((l) => String(l.post)))

    const items = posts.map((p) => ({
      ...p.toObject(),
      likeCount: likeMap.get(String(p._id)) || 0,
      commentCount: commentMap.get(String(p._id)) || 0,
      likedByMe: myLikeSet.has(String(p._id)),
    }))

    return res.status(200).json({ posts: items })
  } catch (err) {
    console.error("Get posts error", err)
    return res.status(500).json({ message: "Failed to fetch posts" })
  }
}

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid post id" })

    const post = await Post.findById(id).populate("postedBy", "name email role profilePicture company")
    if (!post) return res.status(404).json({ message: "Post not found" })

    const [likeCount, commentCount, liked] = await Promise.all([
      Like.countDocuments({ post: id }),
      Comment.countDocuments({ post: id }),
      Like.findOne({ post: id, user: req.user._id }),
    ])

    return res.status(200).json({
      post: {
        ...post.toObject(),
        likeCount,
        commentCount,
        likedByMe: Boolean(liked),
      },
    })
  } catch (err) {
    console.error("Get post by id error", err)
    return res.status(500).json({ message: "Failed to fetch post" })
  }
}

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid post id" })

    const post = await Post.findById(id)
    if (!post) return res.status(404).json({ message: "Post not found" })

    const isOwner = String(post.postedBy) === String(req.user._id)
    const isAdmin = req.user.role === "admin"
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not allowed" })

    const allowed = ["title", "description", "postType", "image"]
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) post[k] = req.body[k]
    })
    await post.save()

    const populated = await Post.findById(post._id).populate("postedBy", "name email role profilePicture company")
    return res.status(200).json({ post: populated })
  } catch (err) {
    console.error("Update post error", err)
    return res.status(500).json({ message: "Failed to update post" })
  }
}

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid post id" })

    const post = await Post.findById(id)
    if (!post) return res.status(404).json({ message: "Post not found" })

    const isOwner = String(post.postedBy) === String(req.user._id)
    const isAdmin = req.user.role === "admin"
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not allowed" })

    await Promise.all([
      Comment.deleteMany({ post: id }),
      Like.deleteMany({ post: id }),
      Post.findByIdAndDelete(id),
    ])

    return res.status(200).json({ message: "Post deleted" })
  } catch (err) {
    console.error("Delete post error", err)
    return res.status(500).json({ message: "Failed to delete post" })
  }
}

