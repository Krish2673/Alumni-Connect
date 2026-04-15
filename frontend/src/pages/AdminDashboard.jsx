import { useEffect, useState } from "react"
import { apiFetch } from "../api/client"

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function load() {
    setError("")
    setLoading(true)
    try {
      const data = await apiFetch("/api/v1/admin/alumni/pending")
      setUsers(data.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function verify(id) {
    setSaving(true)
    setError("")
    try {
      await apiFetch(`/api/v1/admin/alumni/${id}/verify`, { method: "POST" })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container">
      <div className="split">
        <div>
          <h1 className="h1">Admin</h1>
          <p className="muted">Verify alumni accounts before they can create posts.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading ? <div className="muted">Loading pending alumni…</div> : null}
      {error ? <div className="alert">{error}</div> : null}

      {!loading && users.length === 0 ? <div className="ok">No alumni pending verification.</div> : null}

      {!loading && users.length > 0 ? (
        <div className="list">
          {users.map((u) => (
            <section key={u._id} className="card">
              <div className="row between" style={{ marginTop: 0 }}>
                <div>
                  <div className="strong">{u.name}</div>
                  <div className="muted small">{u.email}</div>
                  <div className="muted small">{u.batch ?? "—"} · {u.branch ?? "—"}</div>
                  {u.company ? <div className="muted small">Company: {u.company}</div> : null}
                </div>
                <div className="row" style={{ marginTop: 0 }}>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => verify(u._id)}
                    disabled={saving}
                  >
                    {saving ? "Verifying…" : "Verify"}
                  </button>
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  )
}

