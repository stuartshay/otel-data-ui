import {
  formatReverseGeocodedAddress,
  useReverseGeocodedAddress,
} from './useReverseGeocodedAddress'

interface SegmentPointAddressProps {
  latitude: number | null | undefined
  longitude: number | null | undefined
  selected: boolean
}

export function SegmentPointAddress({
  latitude,
  longitude,
  selected,
}: Readonly<SegmentPointAddressProps>) {
  const address = useReverseGeocodedAddress(latitude, longitude)

  return (
    <div
      className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
      data-testid="segment-point-address"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-xs text-muted-foreground">
          {selected ? 'Selected point address' : 'Start point address'}
        </span>
        <span
          className="font-medium"
          data-testid="segment-point-address-value"
          aria-live="polite"
        >
          {formatReverseGeocodedAddress(address)}
        </span>
      </div>
    </div>
  )
}
