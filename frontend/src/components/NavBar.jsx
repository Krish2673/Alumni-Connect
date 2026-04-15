import { Link, NavLink, useNavigate } from "react-router-dom"
import { useState } from "react"
import { apiFetch } from "../api/client"
import { getTheme, toggleTheme } from "../theme.js"

export default function NavBar({ user, onLogout }) {
  const navigate = useNavigate()
  const [dark, setDark] = useState(() => getTheme() === "dark")
  const collegeLogoSrc = "/college-logo.png"

  function handleThemeClick() {
    const next = toggleTheme()
    setDark(next === "dark")
  }

  async function handleLogout() {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" })
    } catch {
      // Clear UI even if the server session is already gone
    }
    onLogout?.()
    navigate("/login")
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link className="brand" to="/">
          {/* <span className="brand-logo-wrap" aria-hidden>
            <img className="brand-logo" src={collegeLogoSrc} alt="" />
          </span> */}
          DYPCOE Alumni Connect
        </Link>
        <nav className="navlinks">
          {user ? (
            user.role === "student" ? (
              <NavLink to="/student">Student</NavLink>
            ) : user.role === "alumni" ? (
              <NavLink to="/alumni">Alumni</NavLink>
            ) : user.role === "admin" ? (
              <NavLink to="/admin">Admin</NavLink>
            ) : null
          ) : (
            <NavLink to="/" end>
              Feed
            </NavLink>
          )}
          <NavLink to="/connections">Connections</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          <button
            type="button"
            className="btn btn-ghost theme-toggle"
            onClick={handleThemeClick}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? "☀️" : "🌙"}
          </button>
          {user ? (
            <button className="btn btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <NavLink to="/login">Login</NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}

