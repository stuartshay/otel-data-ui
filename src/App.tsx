import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client/react'
import { Toaster } from 'sonner'
import { getApolloClient } from '@/lib/apollo'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingState } from '@/components/shared/LoadingState'
import { DashboardPage } from '@/pages/DashboardPage'
import { CallbackPage } from '@/pages/CallbackPage'

// Lazy-loaded so each route's code (and its dependencies, e.g. Leaflet,
// Recharts) only downloads when a user actually navigates there, instead of
// all 14 pages bundling into the single >800KB initial chunk. Dashboard and
// Callback stay static: Dashboard is the landing route (no loading flash on
// first paint), Callback is the OAuth redirect target (must resolve fast).
const LocationsPage = lazy(() =>
  import('@/pages/LocationsPage').then((m) => ({ default: m.LocationsPage })),
)
const LocationDetailPage = lazy(() =>
  import('@/pages/LocationDetailPage').then((m) => ({
    default: m.LocationDetailPage,
  })),
)
const GarminPage = lazy(() =>
  import('@/pages/GarminPage').then((m) => ({ default: m.GarminPage })),
)
const GarminDetailPage = lazy(() =>
  import('@/pages/GarminDetailPage').then((m) => ({
    default: m.GarminDetailPage,
  })),
)
const LapComparisonPage = lazy(() =>
  import('@/pages/LapComparisonPage').then((m) => ({
    default: m.LapComparisonPage,
  })),
)
const GarminSegmentsPage = lazy(() =>
  import('@/pages/GarminSegmentsPage').then((m) => ({
    default: m.GarminSegmentsPage,
  })),
)
const GarminSegmentDetailPage = lazy(() =>
  import('@/pages/GarminSegmentDetailPage').then((m) => ({
    default: m.GarminSegmentDetailPage,
  })),
)
const MapPage = lazy(() =>
  import('@/pages/MapPage').then((m) => ({ default: m.MapPage })),
)
const DailySummaryPage = lazy(() =>
  import('@/pages/DailySummaryPage').then((m) => ({
    default: m.DailySummaryPage,
  })),
)
const DailySummaryDetailPage = lazy(() =>
  import('@/pages/DailySummaryDetailPage').then((m) => ({
    default: m.DailySummaryDetailPage,
  })),
)
const ReferencesPage = lazy(() =>
  import('@/pages/ReferencesPage').then((m) => ({
    default: m.ReferencesPage,
  })),
)
const SpatialPage = lazy(() =>
  import('@/pages/SpatialPage').then((m) => ({ default: m.SpatialPage })),
)
const GeocodingPage = lazy(() =>
  import('@/pages/GeocodingPage').then((m) => ({
    default: m.GeocodingPage,
  })),
)

export default function App() {
  return (
    <ApolloProvider client={getApolloClient()}>
      <ThemeProvider>
        <AuthProvider>
          <Toaster richColors />
          <BrowserRouter>
            <Suspense fallback={<LoadingState message="Loading page..." />}>
              <Routes>
                <Route path="/callback" element={<CallbackPage />} />
                <Route element={<AppLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="locations" element={<LocationsPage />} />
                  <Route
                    path="locations/:id"
                    element={<LocationDetailPage />}
                  />
                  <Route path="garmin" element={<GarminPage />} />
                  <Route
                    path="garmin/compare"
                    element={<LapComparisonPage />}
                  />
                  <Route
                    path="garmin/segments"
                    element={<GarminSegmentsPage />}
                  />
                  <Route
                    path="garmin/segments/:segmentId"
                    element={<GarminSegmentDetailPage />}
                  />
                  <Route
                    path="garmin/:activityId"
                    element={<GarminDetailPage />}
                  />
                  <Route path="map" element={<MapPage />} />
                  <Route path="daily-summary" element={<DailySummaryPage />} />
                  <Route
                    path="daily-summary/:date"
                    element={<DailySummaryDetailPage />}
                  />
                  <Route path="references" element={<ReferencesPage />} />
                  <Route path="spatial" element={<SpatialPage />} />
                  <Route path="geocoding" element={<GeocodingPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ApolloProvider>
  )
}
