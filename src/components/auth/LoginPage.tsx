import { useState } from 'react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setUser = useAuthStore((s) => s.setUser)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login'
      const data = await api.post<{
        user: { id: string; email: string }
        accessToken: string
        refreshToken: string
      }>(endpoint, { email, password })
      setUser(data.user, data.accessToken, data.refreshToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : '认证失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-accent)]/15 mb-4">
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {isRegister ? '创建账户' : '欢迎回来'}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {isRegister ? '从今天开始，慢慢建立自己的节奏。' : '深呼吸一下，继续照顾好自己。'}
          </p>
        </div>

        <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-colors"
                placeholder="至少 8 个字符"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-accent)] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? '请稍候...' : isRegister ? '创建账户' : '登录'}
            </button>
          </form>

          <p className="text-sm text-center mt-5 text-[var(--color-text-secondary)]">
            {isRegister ? '已经有账户了？' : '还没有账户？'}{' '}
            <button
              onClick={() => { setIsRegister(!isRegister); setError('') }}
              className="text-[var(--color-accent)] font-medium hover:underline"
            >
              {isRegister ? '去登录' : '创建一个'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
