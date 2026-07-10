import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Bike,
  Footprints,
  Dumbbell,
  Waves,
  Activity,
} from 'lucide-react'

const sportIcons: Record<string, React.ReactNode> = {
  cycling: <Bike className="h-6 w-6" />,
  running: <Footprints className="h-6 w-6" />,
  swimming: <Waves className="h-6 w-6" />,
  strength_training: <Dumbbell className="h-6 w-6" />,
}

interface ActivityHeaderProps {
  sport: string
  subSport?: string | null
  startTime?: string | null
  deviceManufacturer?: string | null
  device?: {
    model?: string | null
    software_version?: string | null
    manufacturer?: string | null
  } | null
  backTo?: string
}

export function ActivityHeader({
  sport,
  subSport,
  startTime,
  deviceManufacturer,
  device,
  backTo = '/garmin',
}: ActivityHeaderProps) {
  const icon = sportIcons[sport] ?? <Activity className="h-6 w-6" />

  const deviceModel = device?.model
  const deviceFirmware = device?.software_version
  const deviceLabel = deviceManufacturer ?? device?.manufacturer

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" asChild>
        <Link to={backTo} data-testid="back-to-list">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <h1 className="text-2xl font-bold capitalize tracking-tight">
          {sport.replaceAll('_', ' ')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {startTime
            ? new Date(startTime).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })
            : 'Unknown date'}
        </p>
      </div>
      <div className="flex gap-2">
        {subSport && (
          <Badge variant="secondary" className="capitalize">
            {subSport.replaceAll('_', ' ')}
          </Badge>
        )}
        {deviceModel ? (
          <Badge
            variant="outline"
            data-testid="device-badge"
            title={
              deviceFirmware
                ? `${deviceModel} \u00b7 firmware ${deviceFirmware}`
                : deviceModel
            }
          >
            {deviceModel}
            {deviceFirmware && (
              <span className="ml-1 text-muted-foreground">
                v{deviceFirmware}
              </span>
            )}
          </Badge>
        ) : (
          deviceLabel && (
            <Badge variant="outline" className="capitalize">
              {deviceLabel}
            </Badge>
          )
        )}
      </div>
    </div>
  )
}
