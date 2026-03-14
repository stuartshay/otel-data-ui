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

  it('cycles the theme toggle using the current theme', async () => {
    const user = userEvent.setup()
    const setTheme = vi.fn()
    useThemeMock.mockReturnValue({
      theme: 'dark',
      setTheme,
    })

    renderLayout()
    await user.click(screen.getByTitle('Theme: dark'))

    expect(setTheme).toHaveBeenCalledWith('system')
  })
})
