import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { forwardGeocode, type PeliasFeature } from '@/services/geocoder'

export function ForwardGeocode() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PeliasFeature[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await forwardGeocode(query.trim())
      setResults(data.features)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forward Geocode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for an address or place..."
            className="w-full rounded border bg-background px-2 py-1 text-sm"
          />
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {results.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Layer</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Coordinates</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((f) => (
                  <TableRow key={f.properties.gid}>
                    <TableCell className="font-medium">
                      {f.properties.name}
                    </TableCell>
                    <TableCell className="text-xs">
                      {f.properties.label}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{f.properties.layer}</Badge>
                    </TableCell>
                    <TableCell>
                      {f.properties.confidence != null
                        ? `${(f.properties.confidence * 100).toFixed(0)}%`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {f.geometry.coordinates[1].toFixed(5)},{' '}
                      {f.geometry.coordinates[0].toFixed(5)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
