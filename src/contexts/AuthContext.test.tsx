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
  const [logoutError, setLogoutError] = useState('')
  const [token, setToken] = useState('none')
  const {
    isAuthenticated,
    isLoading,
    login,
    logout,
    getAccessToken,
    refreshUser,
    userProfile,
  } = useAuth()

  return (
    <div>
      <div data-testid="auth">{String(isAuthenticated)}</div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="email">{userProfile?.email ?? 'none'}</div>
      <div data-testid="login-error">{loginError || 'none'}</div>
      <div data-testid="logout-error">{logoutError || 'none'}</div>
      <div data-testid="token">{token}</div>
      <button
        onClick={() => login().catch((error) => setLoginError(error.message))}
      >
        login
      </button>
      <button
        onClick={() => logout().catch((error) => setLogoutError(error.message))}
      >
        logout
      </button>
      <button
        onClick={() =>
          getAccessToken()
            .then((value) => setToken(value ?? 'none'))
            .catch(() => setToken('error'))
        }
      >
        token
      </button>
      <button onClick={() => refreshUser()}>refresh</button>
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

  it('recovers from user loading errors and refreshes user state', async () => {
    const user = userEvent.setup()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    authServiceMock.getUser.mockRejectedValueOnce(new Error('load failed'))
    authServiceMock.getUser.mockResolvedValueOnce({
      expired: false,
      profile: { email: 'refreshed@example.com' },
    })
    authServiceMock.getUserProfile.mockResolvedValue({
      email: 'refreshed@example.com',
    })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )
    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false'),
    )
    expect(screen.getByTestId('auth')).toHaveTextContent('false')

    await user.click(screen.getByRole('button', { name: 'refresh' }))
    await waitFor(() =>
      expect(screen.getByTestId('email')).toHaveTextContent(
        'refreshed@example.com',
      ),
    )
    errorSpy.mockRestore()
  })

  it('delegates access token retrieval', async () => {
    const user = userEvent.setup()
    authServiceMock.getUser.mockResolvedValue(null)
    authServiceMock.getAccessToken.mockResolvedValue('token-123')
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'token' }))
    await waitFor(() =>
      expect(screen.getByTestId('token')).toHaveTextContent('token-123'),
    )

    authServiceMock.getAccessToken.mockRejectedValue(new Error('token failed'))
    await user.click(screen.getByRole('button', { name: 'token' }))
    await waitFor(() =>
      expect(screen.getByTestId('token')).toHaveTextContent('error'),
    )
  })

  it('surfaces logout failures and clears loading state', async () => {
    const user = userEvent.setup()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    authServiceMock.getUser.mockResolvedValue(null)
    authServiceMock.logout.mockRejectedValue(new Error('logout failed'))
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'logout' }))
    await waitFor(() =>
      expect(screen.getByTestId('logout-error')).toHaveTextContent(
        'logout failed',
      ),
    )
    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false'),
    )
    errorSpy.mockRestore()
  })
})
