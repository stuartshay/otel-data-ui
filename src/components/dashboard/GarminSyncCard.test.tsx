import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))
const graphqlMocks = vi.hoisted(() => ({
  useTriggerGarminSyncMutation: vi.fn(),
}))
const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
}))

vi.mock('@/contexts/AuthContext', () => authMocks)
vi.mock('@/__generated__/graphql', () => graphqlMocks)
vi.mock('sonner', () => ({ toast: toastMocks }))

import { GarminSyncCard } from './GarminSyncCard'

describe('GarminSyncCard', () => {
  const login = vi.fn()
  const triggerSync = vi.fn()

  beforeEach(() => {
    login.mockReset()
    triggerSync.mockReset()
    authMocks.useAuth.mockReset()
    graphqlMocks.useTriggerGarminSyncMutation.mockReset()
    toastMocks.error.mockReset()
    toastMocks.success.mockReset()
    toastMocks.warning.mockReset()

    authMocks.useAuth.mockReturnValue({ isAuthenticated: true, login })
    graphqlMocks.useTriggerGarminSyncMutation.mockReturnValue([
      triggerSync,
      { loading: false },
    ])
  })

  it('prompts unauthenticated users to log in before syncing', async () => {
    const user = userEvent.setup()
    authMocks.useAuth.mockReturnValue({ isAuthenticated: false, login })

    render(<GarminSyncCard />)

    expect(
      screen.getByText('Login required to trigger a manual sync.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(login).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: /sync now/i })).toBeNull()
  })

  it('triggers a sync with empty variables by default', async () => {
    const user = userEvent.setup()

    render(<GarminSyncCard />)

    await user.click(screen.getByRole('button', { name: /sync now/i }))

    expect(triggerSync).toHaveBeenCalledWith({ variables: {} })
  })

  it('passes advanced window and lookback inputs to the sync mutation', async () => {
    const user = userEvent.setup()

    render(<GarminSyncCard />)

    await user.click(screen.getByRole('button', { name: /advanced options/i }))
    await user.type(screen.getByLabelText('Window hours'), '24')
    await user.type(screen.getByLabelText('Lookback'), '7')
    await user.click(screen.getByRole('button', { name: /sync now/i }))

    expect(triggerSync).toHaveBeenCalledWith({
      variables: { window_hours: 24, lookback: 7 },
    })
  })

  it('disables the sync button and shows loading copy while syncing', () => {
    graphqlMocks.useTriggerGarminSyncMutation.mockReturnValue([
      triggerSync,
      { loading: true },
    ])

    render(<GarminSyncCard />)

    expect(screen.getByRole('button', { name: /syncing/i })).toBeDisabled()
  })

  it('shows success, warning, and error toasts from mutation callbacks', () => {
    let options:
      | {
          onCompleted: (data: {
            triggerGarminSync: {
              accepted: boolean
              message: string
              started_at?: string | null
              window_hours?: number | null
              window_start?: string | null
            }
          }) => void
          onError: (error: Error) => void
        }
      | undefined

    graphqlMocks.useTriggerGarminSyncMutation.mockImplementation((opts) => {
      options = opts
      return [triggerSync, { loading: false }]
    })

    render(<GarminSyncCard />)

    options?.onCompleted({
      triggerGarminSync: {
        accepted: true,
        message: 'accepted',
        window_hours: 12,
        window_start: '2026-05-31T00:00:00Z',
      },
    })
    expect(toastMocks.success).toHaveBeenCalledWith('Garmin sync triggered', {
      description: 'Window: 12h from 2026-05-31T00:00:00Z',
    })

    options?.onCompleted({
      triggerGarminSync: {
        accepted: false,
        message: 'Sync already running',
        started_at: '2026-05-31T00:00:00Z',
      },
    })
    expect(toastMocks.warning).toHaveBeenCalledWith('Sync already running', {
      description: 'Running since 2026-05-31T00:00:00Z',
    })

    options?.onError(new Error('gateway unavailable'))
    expect(toastMocks.error).toHaveBeenCalledWith('Sync failed', {
      description: 'gateway unavailable',
    })
  })
})
