
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useNavigationStore } from '@/stores/navigationStore'

interface IOSBackButtonProps {
  fallbackRoute?: string
  previousPageTitle?: string
}

const IOSBackButton = ({ fallbackRoute = '/', previousPageTitle = 'Back' }: IOSBackButtonProps) => {
  const navigate = useNavigate()
  const { popFromStack } = useNavigationStore()

  const handleBack = () => {
    const previousPath = popFromStack()
    
    if (previousPath) {
      navigate(previousPath, { replace: true })
    } else {
      navigate(fallbackRoute, { replace: true })
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="flex items-center space-x-1 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
    >
      <ChevronLeft className="w-5 h-5" />
      <span className="text-sm font-medium">{previousPageTitle}</span>
    </Button>
  )
}

export default IOSBackButton
