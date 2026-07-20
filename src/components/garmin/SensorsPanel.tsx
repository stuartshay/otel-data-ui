import { useMemo } from 'react'
import {
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryWarning,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface ActivitySensor {
  id: number
  device_index: number
  is_primary: boolean
  device_type?: string | null
  manufacturer?: string | null
  product_name?: string | null
  software_version?: string | null
  battery_status?: string | null
  battery_voltage?: number | null
}

interface SensorsPanelProps {
  sensors: ActivitySensor[]
  loading?: boolean
  error?: string | null
}

// FIT antplus_device_type -> friendly label. Falls back to a prettified raw
// value (or the product name) for types not listed here.
const DEVICE_TYPE_LABELS: Record<string, string> = {
  heart_rate: 'Heart Rate Monitor',
  bike_power: 'Power Meter',
  bike_speed: 'Speed Sensor',
  bike_cadence: 'Cadence Sensor',
  bike_speed_cadence: 'Speed/Cadence Sensor',
  bike_light_main: 'Bike Light',
  bike_light_shared: 'Bike Light',
  bike_radar: 'Radar',
  weight_scale: 'Weight Scale',
  muscle_oxygen: 'Muscle Oxygen Sensor',
  environment_sensor_legacy: 'Environment Sensor',
  env_sensor: 'Environment Sensor',
  fitness_equipment: 'Fitness Equipment',
}

function sensorLabel(sensor: ActivitySensor): string {
  if (sensor.is_primary) {
    return sensor.product_name ?? 'Recording Device'
  }
  if (sensor.device_type) {
    return (
      DEVICE_TYPE_LABELS[sensor.device_type] ??
      sensor.product_name ??
      sensor.device_type.replaceAll('_', ' ')
    )
  }
  return sensor.product_name ?? 'Sensor'
}

const BATTERY_META: Record<
  string,
  { label: string; icon: LucideIcon; className: string }
> = {
  new: {
    label: 'New',
    icon: BatteryFull,
    className: 'text-green-600 dark:text-green-400',
  },
  good: {
    label: 'Good',
    icon: BatteryFull,
    className: 'text-green-600 dark:text-green-400',
  },
  ok: {
    label: 'OK',
    icon: BatteryFull,
    className: 'text-green-600 dark:text-green-400',
  },
  low: {
    label: 'Low',
    icon: BatteryLow,
    className: 'text-amber-600 dark:text-amber-400',
  },
  critical: {
    label: 'Critical',
    icon: BatteryWarning,
    className: 'text-red-600 dark:text-red-400',
  },
  charging: {
    label: 'Charging',
    icon: BatteryCharging,
    className: 'text-blue-600 dark:text-blue-400',
  },
}

function BatteryIndicator({ status }: Readonly<{ status?: string | null }>) {
  if (!status) return null
  const meta = BATTERY_META[status] ?? {
    label: 'Unknown',
    icon: Battery,
    className: 'text-muted-foreground',
  }
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs font-medium',
        meta.className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  )
}

export function SensorsPanel({
  sensors,
  loading,
  error,
}: Readonly<SensorsPanelProps>) {
  const sorted = useMemo(
    () => [...sensors].sort((a, b) => a.device_index - b.device_index),
    [sensors],
  )

  return (
    <Card data-testid="sensors-panel">
      <CardHeader>
        <CardTitle className="text-base">Sensors</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading sensors...
          </div>
        )}
        {!loading && error && (
          <p className="text-sm text-muted-foreground py-4">
            Sensors unavailable: {error}
          </p>
        )}
        {!loading && !error && sorted.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            No sensor data recorded for this activity yet.
          </p>
        )}
        {!loading && !error && sorted.length > 0 && (
          <ul className="divide-y">
            {sorted.map((sensor) => (
              <li
                key={sensor.id}
                className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
              >
                <div>
                  <div className="text-sm font-medium">
                    {sensorLabel(sensor)}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {[
                      sensor.manufacturer?.replaceAll('_', ' '),
                      sensor.software_version && `v${sensor.software_version}`,
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </div>
                </div>
                <BatteryIndicator status={sensor.battery_status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
