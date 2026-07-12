import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { renderWithRouter } from '@/test/renderWithRouter'

const useThemeMock = vi.hoisted(() => vi.fn())
const useAuthMock = vi.hoisted(() => vi.fn())

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: useThemeMock,
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: useAuthMock,
}))

import { AppLayout } from './AppLayout'

describe('AppLayout', () => {
  beforeEach(() => {
    useThemeMock.mockReset()
    useAuthMock.mockReset()
    useThemeMock.mockReturnValue({
      theme: 'dark',
      setTheme: vi.fn(),
    })
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      userProfile: { email: 'runner@example.com' },
    })
  })

  function renderLayout(route = '/garmin') {
    return renderWithRouter(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>Dashboard content</div>} />
          <Route path="/garmin" element={<div>Garmin content</div>} />
          <Route
            path="/daily-summary/:date"
            element={<div>Daily summary detail content</div>}
          />
        </Route>
      </Routes>,
      { route },
    )
  }

  it('shows authenticated user details and calls logout', async () => {
    const user = userEvent.setup()
    const logout = vi.fn()
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      login: vi.fn(),
      logout,
      userProfile: { email: 'runner@example.com' },
    })

    renderLayout()

    expect(screen.getByText('runner@example.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Garmin/i })).toHaveClass(
      'bg-sidebar-accent',
    )

    await user.click(screen.getByRole('button', { name: /Logout/i }))

    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('shows login when unauthenticated', async () => {
    const user = userEvent.setup()
    const login = vi.fn()
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      login,
      logout: vi.fn(),
      userProfile: null,
    })

    renderLayout('/')
    await user.click(screen.getByRole('button', { name: /Login/i }))

    expect(login).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['dark', 'system'],
    ['light', 'dark'],
    ['system', 'light'],
  ] as const)('cycles %s theme to %s', async (theme, expectedTheme) => {
    const user = userEvent.setup()
    const setTheme = vi.fn()
    useThemeMock.mockReturnValue({
      theme,
      setTheme,
    })

    renderLayout()

    await user.click(screen.getByTitle(`Theme: ${theme}`))
    expect(setTheme).toHaveBeenCalledWith(expectedTheme)
  })

  it('keeps the daily summary nav item active on day detail pages', () => {
    renderLayout('/daily-summary/2026-03-14')

    expect(screen.getByRole('link', { name: /Daily Summary/i })).toHaveClass(
      'bg-sidebar-accent',
    )
  })

  it('opens and closes the mobile navigation overlay', async () => {
    const user = userEvent.setup()
    renderLayout()

    const menuButton = screen.getByRole('button', {
      name: 'Open navigation menu',
    })
    await user.click(menuButton)
    const overlay = screen.getByRole('button', {
      name: 'Close navigation menu',
    })
    expect(overlay).toBeInTheDocument()

    await user.click(overlay)
    expect(
      screen.queryByRole('button', { name: 'Close navigation menu' }),
    ).not.toBeInTheDocument()

    await user.click(menuButton)
    await user.click(screen.getByRole('button', { name: 'Close sidebar' }))

    await user.click(menuButton)
    await user.click(screen.getByRole('link', { name: /Garmin/i }))
    expect(
      screen.queryByRole('button', { name: 'Close navigation menu' }),
    ).not.toBeInTheDocument()
  })
})
