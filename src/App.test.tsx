import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@apollo/client/react', () => ({
  ApolloProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/lib/apollo', () => ({
  getApolloClient: vi.fn(() => ({})),
}))

vi.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/layout/AppLayout', async () => {
  const { Outlet } = await import('react-router-dom')

  return {
    AppLayout: () => (
      <div>
        <div>Layout shell</div>
        <Outlet />
      </div>
    ),
  }
})

vi.mock('@/pages/DashboardPage', () => ({
  DashboardPage: () => <div>Dashboard page</div>,
}))

vi.mock('@/pages/LocationsPage', () => ({
  LocationsPage: () => <div>Locations page</div>,
}))

vi.mock('@/pages/LocationDetailPage', () => ({
  LocationDetailPage: () => <div>Location detail page</div>,
}))

vi.mock('@/pages/GarminPage', () => ({
  GarminPage: () => <div>Garmin page</div>,
}))

vi.mock('@/pages/GarminDetailPage', () => ({
  GarminDetailPage: () => <div>Garmin detail page</div>,
}))

vi.mock('@/pages/MapPage', () => ({
  MapPage: () => <div>Map page</div>,
}))

vi.mock('@/pages/DailySummaryPage', () => ({
  DailySummaryPage: () => <div>Daily summary page</div>,
}))

vi.mock('@/pages/DailySummaryDetailPage', () => ({
  DailySummaryDetailPage: () => <div>Daily summary detail page</div>,
}))

vi.mock('@/pages/ReferencesPage', () => ({
  ReferencesPage: () => <div>References page</div>,
}))

vi.mock('@/pages/SpatialPage', () => ({
  SpatialPage: () => <div>Spatial page</div>,
}))

vi.mock('@/pages/CallbackPage', () => ({
  CallbackPage: () => <div>Callback page</div>,
}))

import App from './App'

describe('App routes', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('renders the callback route without the main layout shell', () => {
    window.history.replaceState({}, '', '/callback')

    render(<App />)

    expect(screen.getByText('Callback page')).toBeInTheDocument()
    expect(screen.queryByText('Layout shell')).not.toBeInTheDocument()
  })

  it('renders application routes inside the shared layout', async () => {
    window.history.replaceState({}, '', '/references')

    render(<App />)

    expect(await screen.findByText('References page')).toBeInTheDocument()
    expect(screen.getByText('Layout shell')).toBeInTheDocument()
  })

  it('renders the daily summary detail route inside the shared layout', async () => {
    window.history.replaceState({}, '', '/daily-summary/2026-03-14')

    render(<App />)

    expect(
      await screen.findByText('Daily summary detail page'),
    ).toBeInTheDocument()
    expect(screen.getByText('Layout shell')).toBeInTheDocument()
  })
})
