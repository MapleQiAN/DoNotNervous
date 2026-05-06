import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Textarea } from '../../components/common/Textarea'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { EmptyState } from '../../components/common/EmptyState'
import { Toast } from '../../components/common/Toast'
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
import { Header } from '../../components/layout/Header'
import { AppShell } from '../../components/layout/AppShell'

describe('Button', () => {
  it('renders all 4 variants without crashing', () => {
    const variants = ['primary', 'secondary', 'destructive', 'ghost'] as const
    for (const variant of variants) {
      const { unmount } = render(
        <Button variant={variant}>Click me</Button>
      )
      expect(screen.getByText('Click me')).toBeInTheDocument()
      unmount()
    }
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledOnce()
  })
})

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('renders with label and error', () => {
    render(<Input label="Name" error="Required" />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Required')).toBeInTheDocument()
  })
})

describe('Textarea', () => {
  it('renders with placeholder', () => {
    render(<Textarea placeholder="Enter description" />)
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument()
  })
})

describe('ConfirmDialog', () => {
  it('renders title and message', () => {
    render(
      <ConfirmDialog
        title="Delete this task?"
        message="This cannot be undone."
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    expect(screen.getByText('Delete this task?')).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
  })

  it('calls onCancel when cancel clicked', async () => {
    const user = userEvent.setup()
    const handleCancel = vi.fn()
    render(
      <ConfirmDialog
        title="Delete?"
        message="Sure?"
        onConfirm={() => {}}
        onCancel={handleCancel}
      />
    )
    await user.click(screen.getByText('Cancel'))
    expect(handleCancel).toHaveBeenCalledOnce()
  })
})

describe('EmptyState', () => {
  it('renders heading and body', () => {
    render(<EmptyState heading="Nothing here yet" body="Add your first task." />)
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    expect(screen.getByText('Add your first task.')).toBeInTheDocument()
  })
})

describe('Toast', () => {
  it('renders message when visible', () => {
    render(<Toast message="Backup saved" type="success" visible={true} />)
    expect(screen.getByText('Backup saved')).toBeInTheDocument()
  })

  it('does not render when not visible', () => {
    render(<Toast message="Backup saved" type="success" visible={false} />)
    expect(screen.queryByText('Backup saved')).not.toBeInTheDocument()
  })
})

describe('DifficultyBadge', () => {
  it('renders easy/medium/hard variants', () => {
    const difficulties = ['easy', 'medium', 'hard'] as const
    const labels = ['Easy', 'Medium', 'Hard']

    for (let i = 0; i < difficulties.length; i++) {
      const { unmount } = render(
        <DifficultyBadge difficulty={difficulties[i]} />
      )
      expect(screen.getByText(labels[i])).toBeInTheDocument()
      unmount()
    }
  })
})

describe('Header', () => {
  it('renders navigation tabs', () => {
    render(
      <MemoryRouter>
        <Header onSettingsClick={() => {}} />
      </MemoryRouter>
    )
    expect(screen.getByLabelText('Home')).toBeInTheDocument()
    expect(screen.getByLabelText('Tasks')).toBeInTheDocument()
  })
})

describe('AppShell', () => {
  it('renders children inside layout', () => {
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <AppShell showToast={() => {}}>
          <div>test child</div>
        </AppShell>
      </MemoryRouter>
    )
    expect(screen.getByText('test child')).toBeInTheDocument()
  })
})
