import { Link } from "react-router-dom"
import { useCallback, useEffect, useMemo, useState } from "react"
import { apiFetch } from "../api/client"

const GUEST_POSTS = [
  {
    _id: "guest-1",
    title: "DYPCOE Alumni Meet 2026 registrations are open",
    description:
      "Join us at the Akurdi campus auditorium this Saturday for mentoring circles, startup talks, and placement networking.",
    postType: "event",
    postedBy: { name: "Training & Placement Cell", profilePicture: "" },
    likeCount: 32,
    commentCount: 9,
  },
  {
    _id: "guest-2",
    title: "Internship drive for 3rd year students",
    description:
      "Partner companies are opening summer internships for Computer, IT, and Mechanical branches. Keep your profile updated to get shortlisted.",
    postType: "opportunity",
    postedBy: { name: "Career Services, DY Patil COE", profilePicture: "" },
    likeCount: 24,
    commentCount: 6,
  },
]

const GUEST_COMMENTS = {
  "guest-1": [
    { _id: "gc1", content: "Looking forward to meeting seniors from 2018 batch!", user: { name: "A. Sharma" } },
    { _id: "gc2", content: "Will there be transport from the hostel side?", user: { name: "R. Kulkarni" } },
  ],
  "guest-2": [
    { _id: "gc3", content: "Is this open to IT branch as well?", user: { name: "S. Patil" } },
  ],
}

function initials(name) {
  if (!name || typeof name !== "string") return "?"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function PostAvatar({ name, profilePicture, size = 48 }) {
  const s = { width: size, height: size, fontSize: size * 0.35 }
  if (profilePicture && /^https?:\/\//i.test(profilePicture)) {
    return (
      <img
        className="post-avatar-img"
        src={profilePicture}
        alt=""
        style={s}
      />
    )
  }
  return (
    <div className="post-avatar-fallback" style={s}>
      {initials(name)}
    </div>
  )
}

export default function Feed({ user, bootstrapping }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const [showCompose, setShowCompose] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [postType, setPostType] = useState("general")
  const [creating, setCreating] = useState(false)

  const [activeTab, setActiveTab] = useState("all")
  const [search, setSearch] = useState("")

  const [drawerPost, setDrawerPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  const isGuest = !user
  const alumniVerificationStatus =
    user?.role === "alumni" ? user.verificationStatus || "pending" : null
  const canCreatePosts =
    Boolean(user) &&
    (user.role === "admin" || (user.role === "alumni" && alumniVerificationStatus === "verified"))

  function createPostDeniedNotice() {
    if (!user) return "Please login to create a post."
    if (user.role === "student") return "Students cannot create posts."
    if (user.role === "alumni" && alumniVerificationStatus !== "verified")
      return "Alumni verification is pending. Cannot create posts yet."
    return "You are not allowed to create posts."
  }

  const loadCommentsForPost = useCallback(
    async (post) => {
      if (!post) return
      const id = String(post._id)
      if (id.startsWith("guest-")) {
        setComments(GUEST_COMMENTS[id] || [])
        return
      }
      if (isGuest) {
        setComments([])
        return
      }
      setCommentsLoading(true)
      try {
        const data = await apiFetch(`/api/v1/comments/post/${id}`)
        setComments(data.comments || [])
      } catch {
        setComments([])
      } finally {
        setCommentsLoading(false)
      }
    },
    [isGuest]
  )

  useEffect(() => {
    if (drawerPost) {
      setCommentText("")
      loadCommentsForPost(drawerPost)
    } else {
      setComments([])
    }
  }, [drawerPost, loadCommentsForPost])

  async function load() {
    setError("")
    setNotice("")
    setLoading(true)
    try {
      const data = await apiFetch("/api/v1/posts")
      setPosts(data.posts || [])
    } catch (err) {
      if (err.status === 401) {
        setPosts(GUEST_POSTS)
        setNotice("Login to see the full live feed and interact with posts.")
      } else {
        setPosts(GUEST_POSTS)
        setError("Backend is not reachable right now. Showing campus highlights.")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredPosts = useMemo(() => {
    let list = posts
    if (activeTab !== "all") {
      list = list.filter((p) => (p.postType || "general") === activeTab)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((p) => {
        const t = (p.title || "").toLowerCase()
        const d = (p.description || "").toLowerCase()
        const author = (p.postedBy?.name || "").toLowerCase()
        return t.includes(q) || d.includes(q) || author.includes(q)
      })
    }
    return list
  }, [posts, activeTab, search])

  async function createPost(e) {
    e.preventDefault()
    if (isGuest) {
      setNotice("Please login to publish posts.")
      return
    }
    if (!canCreatePosts) {
      setNotice(createPostDeniedNotice())
      return
    }
    setCreating(true)
    setError("")
    try {
      const data = await apiFetch("/api/v1/posts", {
        method: "POST",
        body: { title, description, postType },
      })
      setTitle("")
      setDescription("")
      setPostType("general")
      setPosts((p) => [data.post, ...p])
      setShowCompose(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function toggleLike(postId) {
    if (isGuest) {
      setNotice("Please login to like posts and join conversations.")
      return
    }
    try {
      const data = await apiFetch(`/api/v1/likes/post/${postId}/toggle`, { method: "POST" })
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, likedByMe: data.liked, likeCount: data.likeCount } : p
        )
      )
    } catch (err) {
      setError(err.message)
    }
  }

  function openComments(post) {
    setDrawerPost(post)
  }

  function closeDrawer() {
    setDrawerPost(null)
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!drawerPost || !commentText.trim()) return
    if (isGuest) {
      setNotice("Please login to comment.")
      return
    }
    const postId = String(drawerPost._id)
    if (postId.startsWith("guest-")) {
      setNotice("Sign in to comment on live posts.")
      return
    }
    setSubmittingComment(true)
    try {
      const data = await apiFetch(`/api/v1/comments/post/${postId}`, {
        method: "POST",
        body: { content: commentText.trim() },
      })
      setComments((c) => [data.comment, ...c])
      setCommentText("")
      setPosts((prev) =>
        prev.map((p) =>
          String(p._id) === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
        )
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmittingComment(false)
    }
  }

  async function copyPostLink(postId) {
    const path = `/`
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${path}#post-${postId}` : path
    try {
      await navigator.clipboard.writeText(url)
      setNotice("Link copied to clipboard.")
      setTimeout(() => setNotice(""), 2500)
    } catch {
      setNotice("Could not copy link.")
    }
  }

  const tabs = [
    { id: "all", label: "All" },
    { id: "general", label: "General" },
    { id: "event", label: "Events" },
    { id: "opportunity", label: "Opportunities" },
  ]

  return (
    <div className="feed-page">
      <div className="container feed-inner">
        <div className="feed-main">
          <div className="split feed-top">
            <div>
              <h1 className="h1">DY Patil College of Engineering</h1>
              <p className="muted feed-sub">
                Akurdi campus - updates, alumni stories, and opportunities.
              </p>
            </div>
            <div className="feed-top-actions">
              {!user && !bootstrapping ? (
                <Link className="btn" to="/login">
                  Login to interact
                </Link>
              ) : null}
              <button type="button" className="btn btn-ghost" onClick={load} disabled={loading}>
                Refresh
              </button>
            </div>
          </div>

          <div className="card feed-toolbar">
            <div className="feed-tabs" role="tablist">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t.id}
                  className={`feed-tab ${activeTab === t.id ? "is-active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <label className="feed-search-label">
              <span className="sr-only">Search posts</span>
              <input
                className="input feed-search"
                placeholder="Search posts, people, or keywords…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>

          <div className="card feed-start-post">
            {user?.role === "alumni" ? (
              <div
                className={alumniVerificationStatus === "verified" ? "ok" : "alert"}
                style={{ marginTop: 0, marginBottom: 12 }}
              >
                Alumni verification: {alumniVerificationStatus}
              </div>
            ) : null}
            <div className="feed-start-row">
              <PostAvatar name={user?.name || "Guest"} profilePicture={user?.profilePicture} size={40} />
              {isGuest ? (
                <button
                  type="button"
                  className="feed-start-trigger"
                  onClick={() => {
                    setNotice("")
                    setNotice("Please login to create a post.")
                  }}
                >
                  Start a post — share news, events, or opportunities…
                </button>
              ) : user?.role === "student" ? (
                <div className="muted small">Students can view posts only.</div>
              ) : !canCreatePosts ? (
                <div className="muted small">Alumni verification is pending. You cannot create posts yet.</div>
              ) : (
                <button
                  type="button"
                  className="feed-start-trigger"
                  onClick={() => {
                    setNotice("")
                    if (!canCreatePosts) {
                      setNotice(createPostDeniedNotice())
                      return
                    }
                    setShowCompose((v) => !v)
                  }}
                >
                  Start a post — share news, events, or opportunities…
                </button>
              )}
            </div>
            {isGuest || canCreatePosts ? (
              <button
                type="button"
                className="btn feed-create-btn"
                onClick={() => {
                  setNotice("")
                  if (isGuest) {
                    setNotice("Please login to create a post.")
                    return
                  }
                  if (!canCreatePosts) {
                    setNotice(createPostDeniedNotice())
                    return
                  }
                  setShowCompose((v) => !v)
                }}
              >
                Create post
              </button>
            ) : null}
          </div>

          {showCompose && canCreatePosts ? (
            <form className="card compose-card" onSubmit={createPost}>
              <div className="compose-head">
                <h2 className="h2">New post</h2>
                <button type="button" className="btn btn-ghost btn-small" onClick={() => setShowCompose(false)}>
                  Cancel
                </button>
              </div>
              <p className="muted small">
                Visible to students and alumni of DYPCOE, Akurdi.
              </p>
              <div className="grid2">
                <label className="label">
                  Title
                  <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </label>
                <label className="label">
                  Type
                  <select className="input" value={postType} onChange={(e) => setPostType(e.target.value)}>
                    <option value="general">General</option>
                    <option value="event">Event</option>
                    <option value="opportunity">Opportunity</option>
                  </select>
                </label>
              </div>
              <label className="label">
                Description
                <textarea
                  className="input"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </label>
              <button className="btn" type="submit" disabled={creating}>
                {creating ? "Posting…" : "Post"}
              </button>
            </form>
          ) : null}

          {notice ? <div className="ok feed-notice">{notice}</div> : null}
          {error ? <div className="alert feed-notice">{error}</div> : null}

          {loading ? (
            <div className="muted feed-loading">Loading posts…</div>
          ) : (
            <div className="list feed-list">
              {filteredPosts.map((p) => (
                <article key={p._id} id={`post-${p._id}`} className="card feed-card">
                  <div className="feed-post-head">
                    <PostAvatar
                      name={p.postedBy?.name}
                      profilePicture={p.postedBy?.profilePicture}
                      size={48}
                    />
                    <div className="feed-post-meta">
                      <div className="feed-author-line">
                        <span className="feed-author-name">{p.postedBy?.name || "Member"}</span>
                        <span className="tag feed-type-tag">{p.postType || "general"}</span>
                      </div>
                      <div className="muted small">DYPCOE · Alumni Connect</div>
                    </div>
                  </div>
                  <h3 className="feed-post-title">{p.title}</h3>
                  <div className="post-body feed-post-body">{p.description}</div>
                  <div className="feed-stats muted small">
                    <span>{p.likeCount ?? 0} reactions</span>
                    <span>·</span>
                    <span>{p.commentCount ?? 0} comments</span>
                  </div>
                  <div className="feed-actions">
                    <button
                      type="button"
                      className={`feed-action ${p.likedByMe ? "is-active" : ""}`}
                      onClick={() => toggleLike(p._id)}
                      aria-label={p.likedByMe ? "Unlike post" : "Like post"}
                    >
                      ♥
                    </button>
                    <button
                      type="button"
                      className="feed-action"
                      onClick={() => openComments(p)}
                      aria-label="Open comments"
                    >
                      💬
                    </button>
                    <button
                      type="button"
                      className="feed-action"
                      onClick={() => copyPostLink(p._id)}
                      aria-label="Share post link"
                    >
                      ↗
                    </button>
                  </div>
                </article>
              ))}
              {filteredPosts.length === 0 ? (
                <div className="muted">No posts match your filters.</div>
              ) : null}
            </div>
          )}
        </div>

          <div className="card feed-campus-bottom">
            <h2 className="h2">Campus Highlights</h2>
            <p className="muted small">
              Dr. D. Y. Patil College of Engineering, Akurdi — Pune. Stay connected with peers,
              seniors, and placement updates.
            </p>
            <ul className="feed-campus-list muted small">
              <li>Training &amp; placement drives</li>
              <li>Alumni mentorship</li>
              <li>Hackathons &amp; events</li>
            </ul>
          </div>
      </div>

      {drawerPost ? (
        <div className="drawer-root" role="dialog" aria-modal="true" aria-label="Comments">
          <button type="button" className="drawer-backdrop" onClick={closeDrawer} aria-label="Close" />
          <div className="drawer-panel card">
            <div className="drawer-head">
              <h2 className="h2">Comments</h2>
              <button type="button" className="btn btn-ghost btn-small" onClick={closeDrawer}>
                Close
              </button>
            </div>
            <p className="muted small drawer-post-preview">{drawerPost.title}</p>
            {isGuest && !String(drawerPost._id).startsWith("guest-") ? (
              <p className="muted small">
                <Link to="/login">Login</Link> to read and add comments on live posts.
              </p>
            ) : null}
            {isGuest && String(drawerPost._id).startsWith("guest-") ? (
              <p className="muted small">Sample preview. Login for the full live feed.</p>
            ) : null}
            {commentsLoading ? (
              <div className="muted small">Loading comments…</div>
            ) : (
              <ul className="feed-comment-list">
                {comments.map((c) => (
                  <li key={c._id} className="feed-comment">
                    <PostAvatar name={c.user?.name} profilePicture={c.user?.profilePicture} size={36} />
                    <div>
                      <div className="feed-comment-author">{c.user?.name || "User"}</div>
                      <div className="feed-comment-text">{c.content}</div>
                    </div>
                  </li>
                ))}
                {!commentsLoading && comments.length === 0 ? (
                  <li className="muted small">
                    {isGuest && !String(drawerPost._id).startsWith("guest-")
                      ? "Login to view comments on live posts."
                      : "No comments yet. Be the first."}
                  </li>
                ) : null}
              </ul>
            )}
            {!isGuest && !String(drawerPost._id).startsWith("guest-") ? (
              <form className="feed-comment-form" onSubmit={submitComment}>
                <label className="label">
                  Add a comment
                  <textarea
                    className="input"
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts…"
                  />
                </label>
                <button className="btn btn-small" type="submit" disabled={submittingComment || !commentText.trim()}>
                  {submittingComment ? "Posting…" : "Comment"}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
