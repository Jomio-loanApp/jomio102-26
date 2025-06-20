
import { useNavigate } from 'react-router-dom'
import { useNavigationStore } from '@/stores/navigationStore'

export const useCustomNavigate = () => {
  const navigate = useNavigate()
  const { pushToStack } = useNavigationStore()

  const customNavigate = (path: string, options?: { replace?: boolean }) => {
    if (!options?.replace) {
      // Only push to stack if it's not a replace operation
      const currentPath = window.location.pathname
      pushToStack(currentPath)
    }
    navigate(path, options)
  }

  return customNavigate
}

export default useCustomNavigate
