import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { apiFetch } from "../api/client"

export default function Login({ user, onAuthed }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (user) {
    const dest =
      user.role === "student" ? "/student" : user.role === "alumni" ? "/alumni" : "/admin"
    return <Navigate to={dest} replace />
  }

  async function submit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        body: { email, password },
      })
      onAuthed?.(data.user)
      const dest =
        data.user.role === "student"
          ? "/student"
          : data.user.role === "alumni"
            ? "/alumni"
            : "/admin"
      navigate(dest)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container narrow page-auth">
      <h1 className="h1">Welcome back</h1>
      <p className="muted">Login to your DYPCOE Alumni Connect account.</p>

      <form className="card card-auth" onSubmit={submit}>
        <label className="label">
          Email
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="label">
          Password
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <div className="alert">{error}</div> : null}
        <button className="btn" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <div className="row">
          <span className="muted">New here?</span> <Link to="/register">Create account</Link>
        </div>
      </form>
    </div>
  )
}

