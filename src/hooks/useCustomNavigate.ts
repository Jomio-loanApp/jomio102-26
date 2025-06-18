
import { useNavigate, useLocation } from 'react-router-dom'
import { useNavigationStore } from '@/stores/navigationStore'

export const useCustomNavigate = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { pushToStack } = useNavigationStore()

  const customNavigate = (to: string, options?: { replace?: boolean }) => {
    // Only push to stack if not replacing
    if (!options?.replace) {
      pushToStack(location.pathname)
    }
    navigate(to, options)
  }

  return customNavigate
}
