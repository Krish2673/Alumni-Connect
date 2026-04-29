import { useEffect, useState } from "react"
import { apiFetch } from "../api/client"

export default function Connections() {
  const [connections, setConnections] = useState([])
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [directoryUsers, setDirectoryUsers] = useState([])
  const [error, setError] = useState("")
  const [searchText, setSearchText] = useState("")
  const [companyFilter, setCompanyFilter] = useState("")
  const [skillFilter, setSkillFilter] = useState("")
  const [branchFilter, setBranchFilter] = useState("")
  const [batchFilter, setBatchFilter] = useState("")
  const [loadingDirectory, setLoadingDirectory] = useState(false)
  const [sendingTo, setSendingTo] = useState("")

  async function load() {
    setError("")
    try {
      const [c, inc, out] = await Promise.all([
        apiFetch("/api/v1/connections"),
        apiFetch("/api/v1/connections/incoming"),
        apiFetch("/api/v1/connections/outgoing"),
      ])
      setConnections(c.connections || [])
      setIncoming(inc.requests || [])
      setOutgoing(out.requests || [])
    } catch (err) {
      setError(err.message)
    }
  }

  async function loadDirectory() {
    setError("")
    setLoadingDirectory(true)
    try {
      const params = new URLSearchParams()
      params.set("role", "alumni")
      params.set("excludeMe", "true")
      if (searchText.trim()) params.set("search", searchText.trim())
      if (companyFilter.trim()) params.set("company", companyFilter.trim())
      if (skillFilter.trim()) params.set("skills", skillFilter.trim())
      if (branchFilter.trim()) params.set("branch", branchFilter.trim())
      if (batchFilter.trim()) params.set("batch", batchFilter.trim())

      const result = await apiFetch(`/api/v1/users?${params.toString()}`)
      const safeUsers = (result.users || []).filter(
        (u) => u?.role !== "alumni" || u?.verificationStatus === "verified"
      )
      setDirectoryUsers(safeUsers)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingDirectory(false)
    }
  }

  useEffect(() => {
    load()
    loadDirectory()
  }, [])

  async function sendRequest(receiverId) {
    setError("")
    setSendingTo(receiverId)
    try {
      await apiFetch(`/api/v1/connections/send/${receiverId}`, { method: "POST" })
      await Promise.all([load(), loadDirectory()])
    } catch (err) {
      setError(err.message)
    } finally {
      setSendingTo("")
    }
  }

  async function respond(id, action) {
    setError("")
    try {
      await apiFetch(`/api/v1/connections/respond/${id}`, { method: "POST", body: { action } })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function cancel(id) {
    setError("")
    try {
      await apiFetch(`/api/v1/connections/cancel/${id}`, { method: "DELETE" })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const connectedIds = new Set(connections.map((c) => c.user?._id).filter(Boolean))
  const outgoingIds = new Set(outgoing.map((r) => r.receiver?._id).filter(Boolean))
  const incomingIds = new Set(incoming.map((r) => r.sender?._id).filter(Boolean))

  function getDirectoryAction(userId) {
    if (connectedIds.has(userId)) return { label: "Connected", disabled: true }
    if (outgoingIds.has(userId)) return { label: "Requested", disabled: true }
    if (incomingIds.has(userId)) return { label: "Respond in Incoming", disabled: true }
    return { label: "Connect", disabled: false }
  }

  return (
    <div className="container">
      <div className="split">
        <div>
          <h1 className="h1">Connections</h1>
          <p className="muted">Manage requests and view your network.</p>
        </div>
        <button className="btn btn-ghost" onClick={load}>
          Refresh
        </button>
      </div>

      <section className="card directory-card">
        <h2 className="h2">Search alumni directory</h2>
        <p className="muted">Find alumni by name and filters, then send a request with one click.</p>

        <div className="grid2">
          <label className="label">
            Search by name/keyword
            <input
              className="input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="e.g. Priya, React, Google"
            />
          </label>
          <label className="label">
            Company
            <input
              className="input"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              placeholder="e.g. TCS"
            />
          </label>
          <label className="label">
            Skills (comma separated)
            <input
              className="input"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="e.g. Node.js, AWS"
            />
          </label>
          <label className="label">
            Branch
            <input
              className="input"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              placeholder="e.g. Computer"
            />
          </label>
          <label className="label">
            Batch
            <input
              className="input"
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              placeholder="e.g. 2022"
            />
          </label>
        </div>

        <div className="row">
          <button className="btn" onClick={loadDirectory} disabled={loadingDirectory}>
            {loadingDirectory ? "Searching..." : "Search alumni"}
          </button>
        </div>

        <div className="list directory-list">
          {directoryUsers.map((u) => {
            const action = getDirectoryAction(u._id)
            return (
              <div key={u._id} className="row between directory-item">
                <div>
                  <div className="strong">{u.name}</div>
                  <div className="muted small">
                    {[u.company, u.branch, u.batch].filter(Boolean).join(" | ") || "Profile details not available"}
                  </div>
                  {u.skills?.length ? (
                    <div className="muted small">Skills: {u.skills.slice(0, 6).join(", ")}</div>
                  ) : null}
                </div>
                <button
                  className="btn btn-small"
                  onClick={() => sendRequest(u._id)}
                  disabled={action.disabled || sendingTo === u._id}
                >
                  {sendingTo === u._id ? "Sending..." : action.label}
                </button>
              </div>
            )
          })}
          {loadingDirectory ? <div className="muted">Loading alumni directory...</div> : null}
          {!loadingDirectory && directoryUsers.length === 0 ? (
            <div className="muted">No alumni found for current filters.</div>
          ) : null}
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      <div className="grid3">
        <section className="card">
          <h2 className="h2">Incoming</h2>
          <div className="list">
            {incoming.map((r) => (
              <div key={r._id} className="row between">
                <div>
                  <div className="strong">{r.sender?.name || "Unknown"}</div>
                  <div className="muted small">{r.sender?._id}</div>
                </div>
                <div className="row">
                  <button className="btn btn-small" onClick={() => respond(r._id, "accepted")}>
                    Accept
                  </button>
                  <button className="btn btn-ghost btn-small" onClick={() => respond(r._id, "rejected")}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {incoming.length === 0 ? <div className="muted">No incoming requests.</div> : null}
          </div>
        </section>

        <section className="card">
          <h2 className="h2">Outgoing</h2>
          <div className="list">
            {outgoing.map((r) => (
              <div key={r._id} className="row between">
                <div>
                  <div className="strong">{r.receiver?.name || "Unknown"}</div>
                  <div className="muted small">{r.receiver?._id}</div>
                </div>
                <button className="btn btn-ghost btn-small" onClick={() => cancel(r._id)}>
                  Cancel
                </button>
              </div>
            ))}
            {outgoing.length === 0 ? <div className="muted">No outgoing requests.</div> : null}
          </div>
        </section>

        <section className="card">
          <h2 className="h2">Your network</h2>
          <div className="list">
            {connections.map((c) => (
              <div key={c.connectionId} className="row between">
                <div>
                  <div className="strong">{c.user?.name || "Unknown"}</div>
                  <div className="muted small">{c.user?._id}</div>
                </div>
                <div className="tag">Connected</div>
              </div>
            ))}
            {connections.length === 0 ? <div className="muted">No connections yet.</div> : null}
          </div>
        </section>
      </div>
    </div>
  )
}

