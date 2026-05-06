const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface FetchOptions extends RequestInit {
  token?: string
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...init } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
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
