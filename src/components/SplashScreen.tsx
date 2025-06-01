
import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 300) // Allow fade out animation
    }, 2500)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: '#23b14d' }}
    >
      <div className="flex flex-col items-center">
        <img
          src="https://i.ibb.co/DfZksPCw/NAME-LOGO.jpg"
          alt="JOMIO Logo"
          className="w-48 h-48 object-contain animate-fade-in"
        />
        <div className="mt-4 text-white text-lg font-semibold animate-pulse">
          Welcome to JOMIO
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
