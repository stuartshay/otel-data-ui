import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client/react'
import { Toaster } from 'sonner'
import { getApolloClient } from '@/lib/apollo'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { LocationsPage } from '@/pages/LocationsPage'
import { LocationDetailPage } from '@/pages/LocationDetailPage'
import { GarminPage } from '@/pages/GarminPage'
import { GarminDetailPage } from '@/pages/GarminDetailPage'
import { MapPage } from '@/pages/MapPage'
import { DailySummaryPage } from '@/pages/DailySummaryPage'
import { ReferencesPage } from '@/pages/ReferencesPage'
import { SpatialPage } from '@/pages/SpatialPage'
import { GeocodingPage } from '@/pages/GeocodingPage'
import { CallbackPage } from '@/pages/CallbackPage'

export default function App() {
  return (
    <ApolloProvider client={getApolloClient()}>
      <ThemeProvider>
        <AuthProvider>
          <Toaster richColors />
          <BrowserRouter>
            <Routes>
              <Route path="/callback" element={<CallbackPage />} />
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="locations" element={<LocationsPage />} />
                <Route path="locations/:id" element={<LocationDetailPage />} />
                <Route path="garmin" element={<GarminPage />} />
                <Route
                  path="garmin/:activityId"
                  element={<GarminDetailPage />}
                />
                <Route path="map" element={<MapPage />} />
                <Route path="daily-summary" element={<DailySummaryPage />} />
                <Route path="references" element={<ReferencesPage />} />
                <Route path="spatial" element={<SpatialPage />} />
                <Route path="geocoding" element={<GeocodingPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ApolloProvider>
  )
}
