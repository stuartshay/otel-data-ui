import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { reverseGeocode, type PeliasFeature } from '@/services/geocoder'

export function ReverseGeocode() {
  const [lat, setLat] = useState('40.7484')
  const [lon, setLon] = useState('-73.9857')
  const [results, setResults] = useState<PeliasFeature[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLookup = async () => {
    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)

    if (
      !Number.isFinite(latNum) ||
      !Number.isFinite(lonNum) ||
      latNum < -90 ||
      latNum > 90 ||
      lonNum < -180 ||
      lonNum > 180
    ) {
      setError(
        'Please enter a valid latitude (-90 to 90) and longitude (-180 to 180).',
      )
      setResults([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await reverseGeocode(latNum, lonNum)
      setResults(data.features)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reverse Geocode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Latitude</label>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full rounded border bg-background px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Longitude</label>
            <input
              type="text"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              className="w-full rounded border bg-background px-2 py-1 text-sm"
            />
          </div>
        </div>
        <Button size="sm" onClick={handleLookup} disabled={loading}>
          {loading ? 'Looking up...' : 'Lookup'}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((f) => (
              <div key={f.properties.gid} className="rounded-lg bg-muted p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{f.properties.layer}</Badge>
                  <span className="text-sm font-medium">
                    {f.properties.label}
                  </span>
                </div>
                {f.properties.confidence != null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Confidence: {(f.properties.confidence * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
