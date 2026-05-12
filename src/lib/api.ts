const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5052'

interface FetchOptions extends RequestInit {
  token?: string
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const stored = localStorage.getItem('dnn_auth_tokens')
    if (!stored) return false
    const { refreshToken } = JSON.parse(stored)
    if (!refreshToken) return false

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) return false
      const data = await res.json()
      const { useAuthStore } = await import('../stores/authStore')
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken)
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...init } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })

  if (res.status === 401 && token) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      const { useAuthStore } = await import('../stores/authStore')
      const newToken = useAuthStore.getState().accessToken
      headers['Authorization'] = `Bearer ${newToken}`
      const retry = await fetch(`${API_BASE}${path}`, { ...init, headers })
      const retryData = await retry.json()
      if (!retry.ok) throw new Error(retryData.error || `API error: ${retry.status}`)
      return retryData as T
    }
    const { useAuthStore } = await import('../stores/authStore')
    useAuthStore.getState().logout()
    throw new Error('Session expired')
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `API error: ${res.status}`)
  return data as T
}

export const api = {
  get: <T>(path: string, token?: string) =>
    apiFetch<T>(path, { method: 'GET', token }),

  post: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body), token }),

  patch: <T>(path: string, body: unknown, token: string) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),

  put: <T>(path: string, body: unknown, token: string) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body), token }),

  del: <T>(path: string, token: string) =>
    apiFetch<T>(path, { method: 'DELETE', token }),
}
