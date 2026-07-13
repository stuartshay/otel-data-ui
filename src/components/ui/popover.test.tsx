import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './popover'

describe('Popover primitives', () => {
  it('renders the composed popover with custom content props', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Open details</PopoverTrigger>
        <PopoverAnchor data-testid="popover-anchor" />
        <PopoverContent className="custom-content" align="start" sideOffset={8}>
          <PopoverHeader className="custom-header">
            <PopoverTitle>Activity details</PopoverTitle>
            <PopoverDescription>Selected activity summary</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>,
    )

    expect(
      screen.getByRole('button', { name: 'Open details' }),
    ).toHaveAttribute('data-slot', 'popover-trigger')
    expect(screen.getByTestId('popover-anchor')).toHaveAttribute(
      'data-slot',
      'popover-anchor',
    )
    expect(screen.getByRole('dialog')).toHaveClass('custom-content')
    expect(screen.getByText('Activity details')).toHaveAttribute(
      'data-slot',
      'popover-title',
    )
    expect(screen.getByText('Selected activity summary')).toHaveAttribute(
      'data-slot',
      'popover-description',
    )
    expect(screen.getByText('Activity details').parentElement).toHaveClass(
      'custom-header',
    )
  })

  it.each([null, false, ''])(
    'omits a title when children are %p',
    (children) => {
      const { container } = render(<PopoverTitle>{children}</PopoverTitle>)

      expect(container).toBeEmptyDOMElement()
    },
  )
})
