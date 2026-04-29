import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TransactionPopover } from '../TransactionPopover'
import { useUIStore } from '../../../stores/uiStore'
import type { PointLedgerEntry } from '../../../domain/types'
import '../../../test-setup'

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => 'less than a minute ago',
}))

// Mutable mock data for useRecentTransactions
let mockTransactions: PointLedgerEntry[] = []

vi.mock('../../../hooks/usePoints', () => ({
  useRecentTransactions: () => mockTransactions,
}))

function createMockTransaction(overrides: Partial<PointLedgerEntry> = {}): PointLedgerEntry {
  return {
    id: '1',
    amount: 25,
    type: 'task_complete',
    reason: 'Completed: Walk dog',
    taskId: 't1',
    streakLength: 0,
    multiplier: 1,
    createdAt: new Date(),
    ...overrides,
  }
}

describe('TransactionPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUIStore.setState({ isPointsPopoverOpen: false })
    mockTransactions = []
  })

  it('returns null when isPointsPopoverOpen is false', () => {
    render(<TransactionPopover />)

    expect(screen.queryByText('Recent Points')).not.toBeInTheDocument()
  })

  it('renders Recent Points heading when open', () => {
    useUIStore.setState({ isPointsPopoverOpen: true })

    render(<TransactionPopover />)

    expect(screen.getByText('Recent Points')).toBeInTheDocument()
  })

  it('renders empty state message when no transactions', () => {
    useUIStore.setState({ isPointsPopoverOpen: true })

    render(<TransactionPopover />)

    expect(screen.getByText('Complete a task to start earning points!')).toBeInTheDocument()
  })

  it('renders transaction rows with amount, reason, and time when transactions exist', () => {
    mockTransactions = [
      createMockTransaction({
        id: '1',
        amount: 25,
        type: 'task_complete',
        reason: 'Completed: Walk dog',
      }),
      createMockTransaction({
        id: '2',
        amount: 12,
        type: 'streak_bonus',
        reason: 'Streak bonus (1.5x)',
        streakLength: 10,
        multiplier: 1.5,
      }),
    ]

    useUIStore.setState({ isPointsPopoverOpen: true })

    render(<TransactionPopover />)

    expect(screen.getByText('Completed: Walk dog')).toBeInTheDocument()
    expect(screen.getByText('+25')).toBeInTheDocument()
    expect(screen.getByText('Streak bonus (1.5x)')).toBeInTheDocument()
    expect(screen.getByText('+12')).toBeInTheDocument()
    expect(screen.getAllByText('less than a minute ago')).toHaveLength(2)
  })

  it('close button sets isPointsPopoverOpen to false', async () => {
    useUIStore.setState({ isPointsPopoverOpen: true })

    render(<TransactionPopover />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    await fireEvent.click(closeButton)

    expect(useUIStore.getState().isPointsPopoverOpen).toBe(false)
  })

  it('clicking outside the popover closes it', async () => {
    useUIStore.setState({ isPointsPopoverOpen: true })

    render(
      <div>
        <div data-testid="outside">Outside element</div>
        <TransactionPopover />
      </div>
    )

    // Verify popover is open
    expect(screen.getByText('Recent Points')).toBeInTheDocument()

    // Click outside
    const outsideElement = screen.getByTestId('outside')
    await fireEvent.mouseDown(outsideElement)

    expect(useUIStore.getState().isPointsPopoverOpen).toBe(false)
  })
})
