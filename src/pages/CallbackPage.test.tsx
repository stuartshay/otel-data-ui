import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const callbackMocks = vi.hoisted(() => ({
  handleCallback: vi.fn(),
  useAuth: vi.fn(),
}))

vi.mock('@/services/auth', () => ({
  authService: {
    handleCallback: callbackMocks.handleCallback,
  },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: callbackMocks.useAuth,
}))

import { CallbackPage } from './CallbackPage'

describe('CallbackPage', () => {
  beforeEach(() => {
    callbackMocks.handleCallback.mockReset()
    callbackMocks.useAuth.mockReset()
    callbackMocks.useAuth.mockReturnValue({
      refreshUser: vi.fn().mockResolvedValue(undefined),
    })
  })

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/callback']}>
        <Routes>
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/" element={<div>Home page</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('handles a successful callback and returns to the home page', async () => {
    callbackMocks.handleCallback.mockResolvedValue(undefined)

    renderPage()

    expect(screen.getByText('Completing login...')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('Home page')).toBeInTheDocument(),
    )
    expect(callbackMocks.useAuth().refreshUser).toHaveBeenCalledTimes(1)
  })

  it('navigates home when callback processing fails', async () => {
    callbackMocks.handleCallback.mockRejectedValue(new Error('callback failed'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderPage()

    await waitFor(() =>
      expect(screen.getByText('Home page')).toBeInTheDocument(),
    )

    errorSpy.mockRestore()
  })
})
