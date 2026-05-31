import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DateRangePicker } from './DateRangePicker'

describe('DateRangePicker', () => {
  it('renders selected date labels and clears the range without opening the picker', async () => {
    const user = userEvent.setup()
    const onRangeChange = vi.fn()

    render(
      <DateRangePicker
        dateFrom={new Date(2026, 4, 1)}
        dateTo={new Date(2026, 4, 10)}
        onRangeChange={onRangeChange}
      />,
    )

    expect(screen.getByTestId('date-range-trigger')).toHaveTextContent(
      'May 1, 2026 – May 10, 2026',
    )

    await user.click(screen.getByRole('button', { name: 'Clear date range' }))

    expect(onRangeChange).toHaveBeenCalledWith(undefined, undefined)
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull()
  })

  it('applies preset ranges and clamps impossible ranges to the max date', async () => {
    const user = userEvent.setup()
    const onRangeChange = vi.fn()
    const maxDate = new Date()
    const minDate = new Date(maxDate.getTime() + 24 * 60 * 60 * 1000)

    render(
      <DateRangePicker
        dateFrom={undefined}
        dateTo={undefined}
        minDate={minDate}
        maxDate={maxDate}
        onRangeChange={onRangeChange}
      />,
    )

    await user.click(screen.getByTestId('date-range-trigger'))
    await user.click(await screen.findByRole('button', { name: 'Last 7 days' }))

    expect(onRangeChange).toHaveBeenCalledWith(maxDate, maxDate)
  })

  it('applies additional preset callbacks', async () => {
    const user = userEvent.setup()
    const onRangeChange = vi.fn()

    render(
      <DateRangePicker
        dateFrom={undefined}
        dateTo={undefined}
        onRangeChange={onRangeChange}
      />,
    )

    await user.click(screen.getByTestId('date-range-trigger'))
    await user.click(await screen.findByRole('button', { name: 'Today' }))
    await user.click(screen.getByRole('button', { name: 'Last 30 days' }))
    await user.click(screen.getByRole('button', { name: 'This month' }))

    expect(onRangeChange).toHaveBeenCalledTimes(3)
  })

  it('handles open-ended and invalid date labels', () => {
    const { rerender } = render(
      <DateRangePicker
        dateFrom={new Date('invalid')}
        dateTo={undefined}
        onRangeChange={vi.fn()}
      />,
    )

    expect(screen.getByTestId('date-range-trigger')).toHaveTextContent(
      'Select dates',
    )

    rerender(
      <DateRangePicker
        dateFrom={new Date(2026, 4, 1)}
        dateTo={undefined}
        onRangeChange={vi.fn()}
      />,
    )

    expect(screen.getByTestId('date-range-trigger')).toHaveTextContent(
      'May 1, 2026 – …',
    )
  })
})
