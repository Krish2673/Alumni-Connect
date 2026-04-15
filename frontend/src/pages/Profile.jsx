import { useEffect, useState } from "react"
import { apiFetch, apiUploadForm } from "../api/client"

export default function Profile({ user, onAuthed }) {
  const [form, setForm] = useState({
    name: "",
    batch: "",
    branch: "",
    bio: "",
    company: "",
    skills: "",
    linkedIn: "",
    github: "",
  })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [savedBanner, setSavedBanner] = useState("")
  const [pendingFile, setPendingFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name || "",
      batch: user.batch ?? "",
      branch: user.branch || "",
      bio: user.bio || "",
      company: user.company || "",
      skills: Array.isArray(user.skills) ? user.skills.join(", ") : "",
      linkedIn: user.linkedIn || "",
      github: user.github || "",
    })
  }, [user])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function onPickFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPendingFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  function clearPendingPhoto() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPendingFile(null)
  }

  function cancelEdit() {
    if (!user) return
    setForm({
      name: user.name || "",
      batch: user.batch ?? "",
      branch: user.branch || "",
      bio: user.bio || "",
      company: user.company || "",
      skills: Array.isArray(user.skills) ? user.skills.join(", ") : "",
      linkedIn: user.linkedIn || "",
      github: user.github || "",
    })
    clearPendingPhoto()
    setEditing(false)
    setError("")
    setSavedBanner("")
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      if (pendingFile) {
        const up = await apiUploadForm("/api/v1/users/me/profile-picture", () => {
          const fd = new FormData()
          fd.append("image", pendingFile)
          return fd
        })
        onAuthed?.(up.user)
        clearPendingPhoto()
      }

      const body = {
        name: form.name,
        batch: form.batch ? Number(form.batch) : undefined,
        branch: form.branch || undefined,
        bio: form.bio || undefined,
        company: form.company || undefined,
        skills: form.skills
          ? form.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        linkedIn: form.linkedIn || undefined,
        github: form.github || undefined,
      }
      const data = await apiFetch("/api/v1/users/me", { method: "PATCH", body })
      onAuthed?.(data.user)
      setEditing(false)
      setSavedBanner("Profile saved.")
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  const displayPhoto = previewUrl || user.profilePicture
  const alumniVerificationStatus = user.role === "alumni" ? user.verificationStatus || "pending" : null

  return (
    <div className="container narrow">
      <div className="split profile-header">
        <div>
          <h1 className="h1">Your profile</h1>
          <p className="muted">Keep your details up to date for better connections.</p>
        </div>
        {!editing ? (
          <button
            type="button"
            className="btn"
            onClick={() => {
              setSavedBanner("")
              setEditing(true)
            }}
          >
            Edit
          </button>
        ) : null}
      </div>

      {!editing ? (
        <div className="card profile-view">
          {savedBanner ? <div className="ok profile-saved-banner">{savedBanner}</div> : null}
          {user.profilePicture ? (
            <div className="profile-photo-wrap">
              <img className="profile-photo" src={user.profilePicture} alt="" width={96} height={96} />
            </div>
          ) : null}
          <dl className="profile-dl">
            <dt>Name</dt>
            <dd>{user.name || "—"}</dd>
            <dt>Batch</dt>
            <dd>{user.batch ?? "—"}</dd>
            <dt>Branch</dt>
            <dd>{user.branch || "—"}</dd>
            {user.role === "alumni" ? (
              <>
                <dt>Company</dt>
                <dd>{user.company || "—"}</dd>
                <dt>Verification status</dt>
                <dd>{alumniVerificationStatus}</dd>
              </>
            ) : null}
            <dt>Bio</dt>
            <dd className="profile-bio">{user.bio || "—"}</dd>
            <dt>Skills</dt>
            <dd>
              {Array.isArray(user.skills) && user.skills.length ? user.skills.join(", ") : "—"}
            </dd>
            <dt>LinkedIn</dt>
            <dd>{user.linkedIn ? <a href={user.linkedIn}>{user.linkedIn}</a> : "—"}</dd>
            <dt>GitHub</dt>
            <dd>{user.github ? <a href={user.github}>{user.github}</a> : "—"}</dd>
          </dl>
        </div>
      ) : (
        <form className="card card-auth" onSubmit={save}>
          <div className="profile-photo-edit">
            <div className="profile-photo-row">
              {displayPhoto ? (
                <img className="profile-photo" src={displayPhoto} alt="" width={96} height={96} />
              ) : (
                <div className="profile-photo profile-photo-placeholder" aria-hidden>
                  Photo
                </div>
              )}
              <div className="profile-photo-actions">
                <label className="btn btn-ghost btn-small">
                  Choose image
                  <input className="sr-only" type="file" accept="image/*" onChange={onPickFile} />
                </label>
                {pendingFile ? (
                  <button type="button" className="btn btn-ghost btn-small" onClick={clearPendingPhoto}>
                    Remove selection
                  </button>
                ) : null}
              </div>
            </div>
            <p className="muted small">JPEG, PNG, or WebP. Max 3 MB.</p>
          </div>

          <label className="label">
            Name
            <input className="input" value={form.name} onChange={(e) => setField("name", e.target.value)} />
          </label>
          <div className="grid2">
            <label className="label">
              Batch
              <input className="input" value={form.batch} onChange={(e) => setField("batch", e.target.value)} />
            </label>
            <label className="label">
              Branch
              <input className="input" value={form.branch} onChange={(e) => setField("branch", e.target.value)} />
            </label>
          </div>
          {user.role === "alumni" ? (
            <label className="label">
              Company (alumni)
              <input
                className="input"
                value={form.company}
                onChange={(e) => setField("company", e.target.value)}
              />
            </label>
          ) : null}
          <label className="label">
            Bio
            <textarea className="input" rows={4} value={form.bio} onChange={(e) => setField("bio", e.target.value)} />
          </label>
          <label className="label">
            Skills (comma-separated)
            <input className="input" value={form.skills} onChange={(e) => setField("skills", e.target.value)} />
          </label>
          <div className="grid2">
            <label className="label">
              LinkedIn
              <input className="input" value={form.linkedIn} onChange={(e) => setField("linkedIn", e.target.value)} />
            </label>
            <label className="label">
              GitHub
              <input className="input" value={form.github} onChange={(e) => setField("github", e.target.value)} />
            </label>
          </div>

          {error ? <div className="alert">{error}</div> : null}

          <div className="profile-form-actions">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={cancelEdit} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
