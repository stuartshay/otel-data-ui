import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

export function renderWithRouter(
  ui: ReactElement,
  options?: {
    route?: string
    entries?: Array<
      string | { pathname: string; search?: string; state?: unknown }
    >
  },
) {
  return render(
    <MemoryRouter initialEntries={options?.entries ?? [options?.route ?? '/']}>
      {ui}
    </MemoryRouter>,
  )
}
