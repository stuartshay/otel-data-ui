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
}

export function ActivityHeader({
  sport,
  subSport,
  startTime,
  deviceManufacturer,
}: ActivityHeaderProps) {
  const icon = sportIcons[sport] ?? <Activity className="h-6 w-6" />

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" asChild>
        <Link to="/garmin">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <h1 className="text-2xl font-bold capitalize tracking-tight">
          {sport.replace(/_/g, ' ')}
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
            {subSport.replace(/_/g, ' ')}
          </Badge>
        )}
        {deviceManufacturer && (
          <Badge variant="outline" className="capitalize">
            {deviceManufacturer}
          </Badge>
        )}
      </div>
    </div>
  )
}
