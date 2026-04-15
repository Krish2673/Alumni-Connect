import { useEffect, useState } from "react"
import { apiFetch } from "../api/client"

export default function Connections() {
  const [connections, setConnections] = useState([])
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [error, setError] = useState("")
  const [receiverId, setReceiverId] = useState("")

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

  useEffect(() => {
    load()
  }, [])

  async function send(e) {
    e.preventDefault()
    setError("")
    try {
      await apiFetch(`/api/v1/connections/send/${receiverId}`, { method: "POST" })
      setReceiverId("")
      await load()
    } catch (err) {
      setError(err.message)
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

      <form className="card" onSubmit={send}>
        <label className="label">
          Send request (paste user id)
          <input
            className="input"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            placeholder="Receiver user id"
          />
        </label>
        <button className="btn" disabled={!receiverId}>
          Send
        </button>
        {error ? <div className="alert">{error}</div> : null}
      </form>

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

