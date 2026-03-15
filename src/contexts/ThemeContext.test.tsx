import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from './ThemeContext'

function createMatchMediaController(initialMatches: boolean) {
  let matches = initialMatches
  const listeners = new Set<(event: MediaQueryListEvent) => void>()

  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn((event, listener) => {
      if (event === 'change') {
        listeners.add(listener as (event: MediaQueryListEvent) => void)
      }
    }),
    removeEventListener: vi.fn((event, listener) => {
      if (event === 'change') {
        listeners.delete(listener as (event: MediaQueryListEvent) => void)
      }
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))

  return {
    setMatches(next: boolean) {
      matches = next
      listeners.forEach((listener) =>
        listener({ matches: next } as MediaQueryListEvent),
      )
    },
  }
}

function ThemeConsumer() {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button onClick={() => setTheme('light')}>light</button>
      <button onClick={() => setTheme('dark')}>dark</button>
      <button onClick={() => setTheme('system')}>system</button>
    </div>
  )
}

function OutsideThemeConsumer() {
  useTheme()

  return null
}

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.mocked(window.matchMedia).mockClear()
  })

  it('loads theme from local storage and applies the expected class', async () => {
    localStorage.setItem('theme', 'dark')
    createMatchMediaController(false)

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await waitFor(() => expect(document.documentElement).toHaveClass('dark'))
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('tracks system theme changes when the theme is set to system', async () => {
    const media = createMatchMediaController(false)
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'system' }))
    await waitFor(() => expect(document.documentElement).toHaveClass('light'))

    media.setMatches(true)

    await waitFor(() => expect(document.documentElement).toHaveClass('dark'))
    expect(localStorage.getItem('theme')).toBe('system')
  })

  it('throws when useTheme is used outside the provider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<OutsideThemeConsumer />)).toThrow(
      'useTheme must be used within a ThemeProvider',
    )

    errorSpy.mockRestore()
  })
})
