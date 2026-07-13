import { render, screen } from '@testing-library/react'
import { enGB } from 'date-fns/locale'
import { describe, expect, it } from 'vitest'
import { Calendar } from './calendar'

describe('Calendar', () => {
  it('renders dropdown navigation, week numbers, and a focused selection', () => {
    const selectedDate = new Date(2026, 6, 13)
    const expectedMonth = selectedDate.getMonth().toString()
    const expectedDate = selectedDate.toLocaleDateString(enGB.code)

    const { container } = render(
      <Calendar
        mode="single"
        defaultMonth={selectedDate}
        selected={selectedDate}
        captionLayout="dropdown"
        showWeekNumber
        autoFocus
        locale={enGB}
      />,
    )

    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(container.querySelector('.rdp-week_number')).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: /choose the month/i }),
    ).toHaveValue(expectedMonth)

    const selectedButton = container.querySelector(
      `button[data-day="${expectedDate}"]`,
    )

    expect(selectedButton).toBeInTheDocument()
    expect(selectedButton).toHaveAttribute('data-selected-single', 'true')
    expect(selectedButton).toHaveFocus()
  })
})
