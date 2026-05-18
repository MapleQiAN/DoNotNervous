import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

export function useInitAuth() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const [loading, setLoading] = useState(!!accessToken && !user)

  useEffect(() => {
    if (!accessToken || user) {
      return
    }

    let cancelled = false
    api.get<{ user: { id: string; email: string } }>('/auth/me', accessToken)
      .then((data) => {
        if (!cancelled) {
          setUser(data.user, accessToken, useAuthStore.getState().refreshToken!)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          logout()
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [accessToken, user, setUser, logout])

  return { loading: loading && !!accessToken && !user }
}
