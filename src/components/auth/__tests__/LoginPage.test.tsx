import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from '../LoginPage'

// Mock the API module
vi.mock('../../../lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}))

// Mock the auth store
const mockSetUser = vi.fn()
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: (selector: (state: { setUser: typeof mockSetUser }) => unknown) =>
    selector({ setUser: mockSetUser }),
}))

import { api } from '../../../lib/api'

function getEmailInput() {
  return screen.getByRole('textbox')
}

function getPasswordInput() {
  return document.querySelector('input[type="password"]') as HTMLElement
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    render(<LoginPage />)
    expect(screen.getByText('欢迎回来')).toBeDefined()
    expect(getEmailInput()).toBeDefined()
    expect(getPasswordInput()).toBeDefined()
  })

  it('toggles to register mode', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByText('创建一个'))
    expect(screen.getByRole('heading', { name: '创建账户' })).toBeDefined()
  })

  it('shows error on failed login', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Invalid credentials'))
    render(<LoginPage />)

    await user.type(getEmailInput(), 'test@example.com')
    await user.type(getPasswordInput(), 'wrongpass')
    await user.click(screen.getByRole('button', { name: '登录' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeDefined()
    })
  })

  it('calls setUser on successful login', async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockResolvedValueOnce({
      user: { id: '123', email: 'test@example.com' },
      accessToken: 'at',
      refreshToken: 'rt',
    })
    render(<LoginPage />)

    await user.type(getEmailInput(), 'test@example.com')
    await user.type(getPasswordInput(), 'password123')
    await user.click(screen.getByRole('button', { name: '登录' }))

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(
        { id: '123', email: 'test@example.com' },
        'at',
        'rt',
      )
    })
  })
})
