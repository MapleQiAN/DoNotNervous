import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PointBadge } from '../PointBadge'
import { useUIStore } from '../../../stores/uiStore'
import '../../../test-setup'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    span: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  },
  useMotionValue: (initial: number) => ({
    set: vi.fn(),
    get: () => initial,
  }),
  useSpring: (value: unknown) => value,
  useTransform: (_value: unknown, fn: (v: number) => number) => fn(0),
}))

// Mock usePointBalance with a mutable getter so tests can override
let mockPointBalance = 150

vi.mock('../../../hooks/usePoints', () => ({
  usePointBalance: () => mockPointBalance,
}))

describe('PointBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUIStore.setState({ isPointsPopoverOpen: false })
    mockPointBalance = 150
  })

  it('renders the Zap icon (button with Points aria-label)', () => {
    render(<PointBadge />)

    expect(screen.getByRole('button', { name: /points/i })).toBeInTheDocument()
  })

  it('renders the point balance number', () => {
    render(<PointBadge />)

    expect(screen.getByRole('button', { name: /150/i })).toBeInTheDocument()
  })

  it('clicking the button sets isPointsPopoverOpen to true', async () => {
    render(<PointBadge />)

    const button = screen.getByRole('button', { name: /points/i })
    await fireEvent.click(button)

    expect(useUIStore.getState().isPointsPopoverOpen).toBe(true)
  })

  it('renders 0 when no points exist', () => {
    mockPointBalance = 0

    render(<PointBadge />)

    expect(screen.getByRole('button', { name: /points.*0/i })).toBeInTheDocument()
  })
})
