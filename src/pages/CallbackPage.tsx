import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components/shared/LoadingState'

export function CallbackPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await authService.handleCallback()
        await refreshUser()
        navigate('/', { replace: true })
      } catch (error) {
        console.error('Callback error:', error)
        navigate('/', { replace: true })
      }
    }
    handleCallback()
  }, [navigate, refreshUser])

  return <LoadingState message="Completing login..." />
}
