import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))
const graphqlMocks = vi.hoisted(() => ({
  useCreateGarminSegmentMutation: vi.fn(),
}))
const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}))

vi.mock('@/contexts/AuthContext', () => authMocks)
vi.mock('@/__generated__/graphql', () => graphqlMocks)
vi.mock('sonner', () => ({ toast: toastMocks }))

import { SaveSegmentPopover } from './SaveSegmentPopover'

const baseProps = {
  activityId: '23493313338',
  lapIndex: 1,
  sport: 'cycling',
  startLatitude: 40.79,
  startLongitude: -73.96,
  endLatitude: 40.791,
  endLongitude: -73.965,
  distanceMeters: 508.1,
}

describe('SaveSegmentPopover', () => {
  const login = vi.fn()
  const createSegment = vi.fn()

  beforeEach(() => {
    login.mockReset()
    createSegment.mockReset()
    authMocks.useAuth.mockReset()
    graphqlMocks.useCreateGarminSegmentMutation.mockReset()
    toastMocks.error.mockReset()
    toastMocks.success.mockReset()

    authMocks.useAuth.mockReturnValue({ isAuthenticated: true, login })
    graphqlMocks.useCreateGarminSegmentMutation.mockReturnValue([
      createSegment,
      { loading: false },
    ])
  })

  it('prompts unauthenticated users to log in', async () => {
    const user = userEvent.setup()
    authMocks.useAuth.mockReturnValue({ isAuthenticated: false, login })

    render(<SaveSegmentPopover {...baseProps} />)
    await user.click(screen.getByTestId('save-segment-trigger'))

    expect(
      screen.getByText('Log in to save this lap as a named segment.'),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: /login/i }))
    expect(login).toHaveBeenCalledTimes(1)
    expect(createSegment).not.toHaveBeenCalled()
  })

  it('submits the segment with lap-derived coordinates', async () => {
    const user = userEvent.setup()

    render(<SaveSegmentPopover {...baseProps} />)
    await user.click(screen.getByTestId('save-segment-trigger'))

    await user.type(screen.getByTestId('save-segment-name'), 'Harlem Hill')
    await user.click(screen.getByTestId('save-segment-submit'))

    expect(createSegment).toHaveBeenCalledTimes(1)
    expect(createSegment).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Harlem Hill',
          sport: 'cycling',
          start_latitude: 40.79,
          start_longitude: -73.96,
          end_latitude: 40.791,
          end_longitude: -73.965,
          distance_meters: 508.1,
          match_tolerance_meters: 35,
          source_activity_id: '23493313338',
          source_lap_index: 0,
        },
      },
    })
  })

  it('keeps the submit button disabled until a name is entered', async () => {
    const user = userEvent.setup()

    render(<SaveSegmentPopover {...baseProps} />)
    await user.click(screen.getByTestId('save-segment-trigger'))

    expect(screen.getByTestId('save-segment-submit')).toBeDisabled()
  })
})
