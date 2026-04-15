import { Link, Navigate, Route, Routes } from "react-router-dom"
import { useEffect, useState } from "react"
import NavBar from "./components/NavBar.jsx"
import Login from "./pages/Login.jsx"
import Register from "./pages/Register.jsx"
import Feed from "./pages/Feed.jsx"
import Profile from "./pages/Profile.jsx"
import Connections from "./pages/Connections.jsx"
import StudentFeed from "./pages/StudentFeed.jsx"
import AlumniFeed from "./pages/AlumniFeed.jsx"
import AdminDashboard from "./pages/AdminDashboard.jsx"
import { apiFetch } from "./api/client"

function ProtectedRoute({ children, user, bootstrapping, title, subtitle }) {
  if (bootstrapping) {
    return (
      <div className="container">
        <p className="muted">Loading session…</p>
      </div>
    )
  }
  if (!user) {
    return (
      <div className="container narrow">
        <div className="card">
          <h1 className="h1">{title || "Login required"}</h1>
          <p className="muted">{subtitle || "Please login to continue."}</p>
          <div className="row">
            <Link className="btn" to="/login">
              Login
            </Link>
            <Link className="btn btn-ghost" to="/register">
              Create account
            </Link>
          </div>
        </div>
      </div>
    )
  }
  return children
}

function RoleProtectedRoute({ children, user, bootstrapping, allowedRoles, title, subtitle }) {
  if (bootstrapping) {
    return (
      <div className="container">
        <p className="muted">Loading session…</p>
      </div>
    )
  }
  if (!user) {
    return (
      <div className="container narrow">
        <div className="card">
          <h1 className="h1">{title || "Login required"}</h1>
          <p className="muted">{subtitle || "Please login to continue."}</p>
          <div className="row">
            <Link className="btn" to="/login">
              Login
            </Link>
            <Link className="btn btn-ghost" to="/register">
              Create account
            </Link>
          </div>
        </div>
      </div>
    )
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="container narrow">
        <div className="card">
          <h1 className="h1">Access denied</h1>
          <p className="muted">
            {subtitle || "This area is available for specific roles."}
          </p>
          <div className="row">
            <Link className="btn" to="/">
              Go to feed
            </Link>
          </div>
        </div>
      </div>
    )
  }
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await apiFetch("/api/v1/auth/me")
        if (!cancelled) setUser(data.user)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="app">
      <NavBar user={user} onLogout={() => setUser(null)} />
      <main className="main">
        <Routes>
          <Route path="/" element={<Feed user={user} bootstrapping={bootstrapping} />} />
          <Route
            path="/student"
            element={
              <RoleProtectedRoute
                user={user}
                bootstrapping={bootstrapping}
                allowedRoles={["student"]}
                title="Login to view Student interface"
                subtitle="Only students can access the student interface."
              >
                <StudentFeed user={user} bootstrapping={bootstrapping} />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/alumni"
            element={
              <RoleProtectedRoute
                user={user}
                bootstrapping={bootstrapping}
                allowedRoles={["alumni"]}
                title="Login to view Alumni interface"
                subtitle="Only alumni can access the alumni interface."
              >
                <AlumniFeed user={user} bootstrapping={bootstrapping} />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <RoleProtectedRoute
                user={user}
                bootstrapping={bootstrapping}
                allowedRoles={["admin"]}
                title="Login to view Admin interface"
                subtitle="Only admins can access the admin interface."
              >
                <AdminDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={<Login user={user} onAuthed={(u) => setUser(u)} />}
          />
          <Route
            path="/register"
            element={<Register user={user} />}
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute
                user={user}
                bootstrapping={bootstrapping}
                title="Login to view your profile"
                subtitle="Your DY Patil profile details are available after sign in."
              >
                <Profile user={user} onAuthed={(u) => setUser(u)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/connections"
            element={
              <ProtectedRoute
                user={user}
                bootstrapping={bootstrapping}
                title="Login to manage connections"
                subtitle="Connection requests and your alumni network are available after sign in."
              >
                <Connections />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
