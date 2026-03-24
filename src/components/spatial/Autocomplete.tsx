import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  autocomplete as fetchAutocomplete,
  type PeliasFeature,
} from '@/services/geocoder'

export function Autocomplete() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PeliasFeature[]>([])
  const [selected, setSelected] = useState<PeliasFeature | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const trimmedQuery = query.trim()

    if (trimmedQuery.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const currentRequestId = ++requestIdRef.current

    timerRef.current = setTimeout(async () => {
      if (currentRequestId !== requestIdRef.current) return

      setLoading(true)
      setError(null)
      try {
        const data = await fetchAutocomplete(trimmedQuery)
        if (currentRequestId !== requestIdRef.current) return
        setResults(data.features)
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) return
        setError(err instanceof Error ? err.message : 'Autocomplete failed')
        setResults([])
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      requestIdRef.current++
    }
  }, [query])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Autocomplete</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(null)
            }}
            placeholder="Start typing a place name..."
            className="w-full rounded border bg-background px-2 py-1 text-sm"
          />
          {loading && (
            <p className="mt-1 text-xs text-muted-foreground">Searching...</p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {results.length > 0 && !selected && (
          <div className="space-y-1">
            {results.map((f) => (
              <button
                key={f.properties.gid}
                type="button"
                onClick={() => setSelected(f)}
                className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span className="font-medium">{f.properties.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {f.properties.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{selected.properties.layer}</Badge>
              <span className="font-medium">{selected.properties.name}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {selected.properties.label}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-muted-foreground">Coordinates</span>
              <span className="font-mono">
                {selected.geometry.coordinates[1].toFixed(5)},{' '}
                {selected.geometry.coordinates[0].toFixed(5)}
              </span>
              {selected.properties.locality && (
                <>
                  <span className="text-muted-foreground">Locality</span>
                  <span>{selected.properties.locality}</span>
                </>
              )}
              {selected.properties.neighbourhood && (
                <>
                  <span className="text-muted-foreground">Neighbourhood</span>
                  <span>{selected.properties.neighbourhood}</span>
                </>
              )}
              {selected.properties.borough && (
                <>
                  <span className="text-muted-foreground">Borough</span>
                  <span>{selected.properties.borough}</span>
                </>
              )}
              {selected.properties.region && (
                <>
                  <span className="text-muted-foreground">Region</span>
                  <span>{selected.properties.region}</span>
                </>
              )}
              {selected.properties.postalcode && (
                <>
                  <span className="text-muted-foreground">Postal Code</span>
                  <span>{selected.properties.postalcode}</span>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => setSelected(null)}
            >
              ← Back to results
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
