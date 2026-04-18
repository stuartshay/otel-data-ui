import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hooks = vi.hoisted(() => ({
  useGarminActivitiesQuery: vi.fn(),
}))

vi.mock('@/__generated__/graphql', () => hooks)

import { GarminDayActivitiesDialog } from './GarminDayActivitiesDialog'

function renderDialog(
  props: Partial<React.ComponentProps<typeof GarminDayActivitiesDialog>> = {},
) {
  const onOpenChange = vi.fn()
  const utils = render(
    <MemoryRouter>
      <GarminDayActivitiesDialog
        date="2024-05-10"
        open
        onOpenChange={onOpenChange}
        {...props}
      />
    </MemoryRouter>,
  )
  return { ...utils, onOpenChange }
}

describe('GarminDayActivitiesDialog', () => {
  beforeEach(() => {
    hooks.useGarminActivitiesQuery.mockReset()
  })

  it('renders a loading state while activities are loading', () => {
    hooks.useGarminActivitiesQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    })

    renderDialog()

    expect(screen.getByTestId('garmin-day-dialog-loading')).toBeInTheDocument()
  })

  it('renders an empty state when no activities are returned', () => {
    hooks.useGarminActivitiesQuery.mockReturnValue({
      data: { garminActivities: { items: [], total: 0 } },
      loading: false,
      error: undefined,
    })

    renderDialog()

    expect(screen.getByTestId('garmin-day-dialog-empty')).toBeInTheDocument()
  })

  it('renders formatted activities and closes dialog on sport link click', async () => {
    const user = userEvent.setup()
    hooks.useGarminActivitiesQuery.mockReturnValue({
      data: {
        garminActivities: {
          items: [
            {
              activity_id: 'abc-123',
              sport: 'cycling',
              distance_km: 42.195,
              duration_seconds: 3725,
              avg_heart_rate: 142,
              calories: 910,
              track_point_count: 10707,
              start_time: '2024-05-10T10:00:00Z',
            },
          ],
          total: 1,
        },
      },
      loading: false,
      error: undefined,
    })

    const { onOpenChange } = renderDialog()

    expect(screen.getByText('42.20 km')).toBeInTheDocument()
    expect(screen.getByText('1h 2m')).toBeInTheDocument()
    expect(screen.getByText('142 bpm')).toBeInTheDocument()
    expect(screen.getByText('10,707')).toBeInTheDocument()

    const link = screen.getByTestId('garmin-day-dialog-sport-link')
    expect(link).toHaveAttribute('href', '/garmin/abc-123')

    await user.click(link)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('skips the query when closed', () => {
    hooks.useGarminActivitiesQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    })

    render(
      <MemoryRouter>
        <GarminDayActivitiesDialog
          date="2024-05-10"
          open={false}
          onOpenChange={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(hooks.useGarminActivitiesQuery).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true }),
    )
  })
})
