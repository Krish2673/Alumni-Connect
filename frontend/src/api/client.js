const API_BASE = import.meta.env.VITE_API_BASE_URL || ""

const NO_REFRESH_PATHS = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh-token",
])

let refreshPromise = null

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/api/v1/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.ok)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || ""
  const isJson = contentType.includes("application/json")
  return isJson ? await res.json().catch(() => null) : await res.text().catch(() => null)
}

export async function apiFetch(path, { method = "GET", body, headers, _retried = false } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  let data = await parseResponse(res)

  if (res.status === 401 && !_retried && !NO_REFRESH_PATHS.has(path)) {
    const ok = await refreshSession()
    if (ok) {
      return apiFetch(path, { method, body, headers, _retried: true })
    }
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && data.message) || `Request failed (${res.status})`
    const err = new Error(msg)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

/**
 * POST multipart/form-data with credentials. Pass a factory so 401 retries can rebuild FormData.
 * @param {string} path
 * @param {() => FormData} getFormData
 */
export async function apiUploadForm(path, getFormData, { _retried = false } = {}) {
  const formData = getFormData()
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  })

  let data = await parseResponse(res)

  if (res.status === 401 && !_retried && !NO_REFRESH_PATHS.has(path)) {
    const ok = await refreshSession()
    if (ok) {
      return apiUploadForm(path, getFormData, { _retried: true })
    }
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && data.message) || `Request failed (${res.status})`
    const err = new Error(msg)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}
