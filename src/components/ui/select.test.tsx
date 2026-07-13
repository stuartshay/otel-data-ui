import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select'

describe('Select primitives', () => {
  it('renders grouped popper content and the selected value', () => {
    render(
      <Select defaultOpen defaultValue="cycling">
        <SelectTrigger aria-label="Choose activity" size="sm">
          <SelectValue placeholder="Choose a sport" />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          <SelectGroup className="custom-group">
            <SelectLabel className="custom-label">Sports</SelectLabel>
            <SelectItem value="cycling">Cycling</SelectItem>
            <SelectSeparator className="custom-separator" />
            <SelectItem value="running">Running</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    )

    expect(
      document.querySelector('[data-slot="select-trigger"]'),
    ).toHaveTextContent('Cycling')
    expect(screen.getByText('Sports')).toHaveClass('custom-label')
    expect(screen.getByText('Sports').parentElement).toHaveClass('custom-group')
    expect(
      document.querySelector('[data-slot="select-separator"]'),
    ).toHaveClass('custom-separator')
    expect(
      document.querySelector('[data-slot="select-content"]'),
    ).toHaveAttribute('data-align-trigger', 'false')
  })

  it('uses item-aligned content positioning by default', () => {
    render(
      <Select defaultOpen defaultValue="cycling">
        <SelectTrigger aria-label="Choose activity">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cycling">Cycling</SelectItem>
        </SelectContent>
      </Select>,
    )

    const content = document.querySelector('[data-slot="select-content"]')

    expect(content).toHaveAttribute('data-align-trigger', 'true')
    expect(content).not.toHaveClass('data-[side=bottom]:translate-y-1')
  })
})
