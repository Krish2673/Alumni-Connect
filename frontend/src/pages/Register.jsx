import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { apiFetch } from "../api/client"

export default function Register({ user }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState(null) // student | alumni | admin
  const [batch, setBatch] = useState("")
  const [branch, setBranch] = useState("")
  const [company, setCompany] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

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
      if (!role) {
        setError("Please select a role.")
        return
      }
      await apiFetch("/api/v1/auth/register", {
        method: "POST",
        body: {
          name,
          email,
          password,
          role,
          batch: role === "student" || role === "alumni" ? (batch ? Number(batch) : undefined) : undefined,
          branch: role === "student" || role === "alumni" ? branch || undefined : undefined,
          company: role === "alumni" ? company || undefined : undefined,
        },
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container narrow page-auth">
        <div className="card card-auth">
          <h1 className="h1">Account created</h1>
          <p className="muted">You can now sign in with your email and password.</p>
          <div className="ok">Account created successfully.</div>
          <div className="row">
            <Link className="btn" to="/login">
              Go to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container narrow page-auth">
      {!role ? (
        <div className="card card-auth">
          <h1 className="h1">Create account</h1>
          <p className="muted">Choose who you are to see the right registration fields.</p>

          <div className="row">
            <button
              type="button"
              className="btn"
              onClick={() => {
                setError("")
                setRole("student")
              }}
            >
              Student
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setError("")
                setRole("alumni")
              }}
            >
              Alumni
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setError("")
                setRole("admin")
              }}
            >
              Admin
            </button>
          </div>
          {error ? <div className="alert">{error}</div> : null}

          <div className="row">
            <span className="muted">Already have an account?</span> <Link to="/login">Login</Link>
          </div>
        </div>
      ) : (
        <>
          <h1 className="h1">Create account</h1>
          <p className="muted">
            {role === "student"
              ? "Student details required to connect with alumni."
              : role === "alumni"
                ? "Alumni details required to post after admin verification."
                : "Admin account details."}
          </p>

          <form className="card card-auth" onSubmit={submit}>
            <label className="label">
              Name
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="label">
              Email
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="label">
              Password
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>

            {(role === "student" || role === "alumni") ? (
              <>
                <div className="grid2">
                  <label className="label">
                    Batch
                    <input
                      className="input"
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      required
                      inputMode="numeric"
                    />
                  </label>
                  <label className="label">
                    Branch
                    <input
                      className="input"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      required
                    />
                  </label>
                </div>
              </>
            ) : null}

            {role === "alumni" ? (
              <label className="label">
                Company (required)
                <input
                  className="input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
                <span className="muted small">
                  Your verification status will be shown as pending/verified.
                </span>
              </label>
            ) : null}

            {error ? <div className="alert">{error}</div> : null}

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Register"}
            </button>

            <div className="row">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setRole(null)
                  setError("")
                }}
                disabled={loading}
              >
                Change role
              </button>
              <span className="muted">Already have an account?</span> <Link to="/login">Login</Link>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
