import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const authServiceMock = vi.hoisted(() => ({
  getUser: vi.fn(),
  getUserProfile: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  getAccessToken: vi.fn(),
}))

vi.mock('@/services/auth', () => ({
  authService: authServiceMock,
}))

import { AuthProvider, useAuth } from './AuthContext'

function AuthConsumer() {
  const [loginError, setLoginError] = useState('')
  const { isAuthenticated, isLoading, login, logout, userProfile } = useAuth()

  return (
    <div>
      <div data-testid="auth">{String(isAuthenticated)}</div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="email">{userProfile?.email ?? 'none'}</div>
      <div data-testid="login-error">{loginError || 'none'}</div>
      <button
        onClick={() => login().catch((error) => setLoginError(error.message))}
      >
        login
      </button>
      <button onClick={() => logout()}>logout</button>
    </div>
  )
}

function OutsideAuthConsumer() {
  useAuth()

  return null
}

describe('AuthContext', () => {
  beforeEach(() => {
    authServiceMock.getUser.mockReset()
    authServiceMock.getUserProfile.mockReset()
    authServiceMock.login.mockReset()
    authServiceMock.logout.mockReset()
    authServiceMock.getAccessToken.mockReset()
  })

  it('loads the current user and profile on mount', async () => {
    authServiceMock.getUser.mockResolvedValue({
      expired: false,
      profile: { email: 'runner@example.com', name: 'Runner', sub: 'abc' },
    })
    authServiceMock.getUserProfile.mockResolvedValue({
      email: 'runner@example.com',
      name: 'Runner',
      sub: 'abc',
    })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false'),
    )

    expect(screen.getByTestId('auth')).toHaveTextContent('true')
    expect(screen.getByTestId('email')).toHaveTextContent('runner@example.com')
  })

  it('logs out and clears authenticated state', async () => {
    authServiceMock.getUser.mockResolvedValue({
      expired: false,
      profile: { email: 'runner@example.com', name: 'Runner', sub: 'abc' },
    })
    authServiceMock.getUserProfile.mockResolvedValue({
      email: 'runner@example.com',
      name: 'Runner',
      sub: 'abc',
    })
    authServiceMock.logout.mockResolvedValue(undefined)

    const user = userEvent.setup()

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('auth')).toHaveTextContent('true'),
    )

    await user.click(screen.getByRole('button', { name: 'logout' }))

    await waitFor(() =>
      expect(screen.getByTestId('auth')).toHaveTextContent('false'),
    )
    expect(screen.getByTestId('email')).toHaveTextContent('none')
  })

  it('surfaces login failures and resets loading state', async () => {
    authServiceMock.getUser.mockResolvedValue(null)
    authServiceMock.login.mockRejectedValue(new Error('redirect failed'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const user = userEvent.setup()

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false'),
    )

    await user.click(screen.getByRole('button', { name: 'login' }))

    await waitFor(() =>
      expect(screen.getByTestId('login-error')).toHaveTextContent(
        'redirect failed',
      ),
    )
    expect(screen.getByTestId('loading')).toHaveTextContent('false')

    errorSpy.mockRestore()
  })

  it('throws when useAuth is used outside the provider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<OutsideAuthConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider',
    )

    errorSpy.mockRestore()
  })
})
