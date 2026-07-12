import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))
const graphqlMocks = vi.hoisted(() => ({
  useDeleteGarminSegmentMutation: vi.fn(),
}))
const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}))

vi.mock('@/contexts/AuthContext', () => authMocks)
vi.mock('@/__generated__/graphql', () => graphqlMocks)
vi.mock('sonner', () => ({ toast: toastMocks }))

import { DeleteSegmentButton } from './DeleteSegmentButton'

describe('DeleteSegmentButton', () => {
  const login = vi.fn()
  const deleteSegment = vi.fn()
  const onDeleted = vi.fn()

  beforeEach(() => {
    login.mockReset()
    deleteSegment.mockReset()
    onDeleted.mockReset()
    authMocks.useAuth.mockReset()
    graphqlMocks.useDeleteGarminSegmentMutation.mockReset()
    toastMocks.error.mockReset()
    toastMocks.success.mockReset()

    authMocks.useAuth.mockReturnValue({ isAuthenticated: true, login })
    graphqlMocks.useDeleteGarminSegmentMutation.mockReturnValue([
      deleteSegment,
      { loading: false },
    ])
  })

  it('prompts unauthenticated users to log in', async () => {
    const user = userEvent.setup()
    authMocks.useAuth.mockReturnValue({ isAuthenticated: false, login })

    render(
      <DeleteSegmentButton
        segmentId={1}
        segmentName="Harlem Hill"
        onDeleted={onDeleted}
      />,
    )
    await user.click(screen.getByTestId('delete-segment-trigger'))

    expect(screen.getByText('Log in to delete this segment.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: /login/i }))
    expect(login).toHaveBeenCalledTimes(1)
    expect(deleteSegment).not.toHaveBeenCalled()
  })

  it('confirms and calls the delete mutation', async () => {
    const user = userEvent.setup()

    render(
      <DeleteSegmentButton
        segmentId={1}
        segmentName="Harlem Hill"
        onDeleted={onDeleted}
      />,
    )
    await user.click(screen.getByTestId('delete-segment-trigger'))

    expect(screen.getByText('Delete “Harlem Hill”?')).toBeVisible()
    await user.click(screen.getByTestId('delete-segment-confirm'))

    expect(deleteSegment).toHaveBeenCalledTimes(1)
    expect(deleteSegment).toHaveBeenCalledWith({ variables: { id: 1 } })
  })

  it('treats a false result as a failure (no navigation)', async () => {
    const user = userEvent.setup()
    graphqlMocks.useDeleteGarminSegmentMutation.mockImplementation(
      (options: { onCompleted?: (data: unknown) => void }) => {
        const fn = vi.fn(() => {
          options.onCompleted?.({ deleteGarminSegment: false })
        })
        return [fn, { loading: false }]
      },
    )

    render(
      <DeleteSegmentButton
        segmentId={1}
        segmentName="Harlem Hill"
        onDeleted={onDeleted}
      />,
    )
    await user.click(screen.getByTestId('delete-segment-trigger'))
    await user.click(screen.getByTestId('delete-segment-confirm'))

    expect(onDeleted).not.toHaveBeenCalled()
    expect(toastMocks.error).toHaveBeenCalled()
    expect(toastMocks.success).not.toHaveBeenCalled()
  })

  it('handles successful and failed mutation callbacks', () => {
    const onDeleted = vi.fn()
    render(
      <DeleteSegmentButton
        segmentId={1}
        segmentName="Harlem Hill"
        onDeleted={onDeleted}
      />,
    )

    const options =
      graphqlMocks.useDeleteGarminSegmentMutation.mock.calls[0]?.[0]
    expect(options).toBeDefined()
    options!.onCompleted({ deleteGarminSegment: true })
    expect(toastMocks.success).toHaveBeenCalledWith('Segment deleted', {
      description:
        '"Harlem Hill" was removed and will be cleared from Garmin Connect shortly.',
    })
    expect(onDeleted).toHaveBeenCalledTimes(1)

    options!.onError(new Error('delete failed'))
    expect(toastMocks.error).toHaveBeenCalledWith('Could not delete segment', {
      description: 'delete failed',
    })
  })

  it('disables confirmation controls while deletion is running', async () => {
    const user = userEvent.setup()
    graphqlMocks.useDeleteGarminSegmentMutation.mockReturnValue([
      deleteSegment,
      { loading: true },
    ])
    render(
      <DeleteSegmentButton
        segmentId={1}
        segmentName="Harlem Hill"
        onDeleted={onDeleted}
      />,
    )
    await user.click(screen.getByTestId('delete-segment-trigger'))

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByTestId('delete-segment-confirm')).toBeDisabled()
    expect(screen.getByTestId('delete-segment-confirm')).toHaveTextContent(
      'Deleting…',
    )
  })

  it('closes the confirmation without deleting when cancelled', async () => {
    const user = userEvent.setup()
    render(
      <DeleteSegmentButton
        segmentId={1}
        segmentName="Harlem Hill"
        onDeleted={onDeleted}
      />,
    )
    await user.click(screen.getByTestId('delete-segment-trigger'))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByText('Delete “Harlem Hill”?')).not.toBeInTheDocument()
    expect(deleteSegment).not.toHaveBeenCalled()
  })
})
