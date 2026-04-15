export const THEME_STORAGE_KEY = "alumni-connect-theme"

/** @returns {"light" | "dark"} */
export function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"
}

/** @param {"light" | "dark"} mode */
export function applyTheme(mode) {
  if (mode === "dark") {
    document.documentElement.setAttribute("data-theme", "dark")
  } else {
    document.documentElement.removeAttribute("data-theme")
  }
}

export function initTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === "dark") {
      applyTheme("dark")
      return
    }
    if (stored === "light") {
      applyTheme("light")
      return
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      applyTheme("dark")
    } else {
      applyTheme("light")
    }
  } catch {
    applyTheme("light")
  }
}

/** @returns {"light" | "dark"} */
export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark"
  applyTheme(next)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // ignore
  }
  return next
}
