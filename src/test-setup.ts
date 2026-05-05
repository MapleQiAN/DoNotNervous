import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

import { vi } from 'vitest'

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}))
