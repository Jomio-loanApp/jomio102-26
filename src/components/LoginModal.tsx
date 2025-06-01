
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const { signIn, signUp } = useAuthStore()
  const { items: cartItems, clearCart } = useCartStore()
  const { items: wishlistItems, clearWishlist } = useWishlistStore()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  })

  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
  })

  const [showMergePrompt, setShowMergePrompt] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('Starting login process...')
      await signIn(loginData.email, loginData.password)
      console.log('Login successful')
      
      // Check if user has guest data to merge
      if (cartItems.length > 0 || wishlistItems.length > 0) {
        setShowMergePrompt(true)
      } else {
        onClose()
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        })
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      })
    } finally {
      console.log('Login process completed, resetting loading state')
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('Starting signup process...')
      await signUp(signupData.email, signupData.password, signupData.fullName, signupData.phoneNumber)
      console.log('Signup successful')
      
      // Check if user has guest data to merge
      if (cartItems.length > 0 || wishlistItems.length > 0) {
        setShowMergePrompt(true)
      } else {
        onClose()
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        })
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      toast({
        title: "Signup failed",
        description: error.message || "An error occurred during signup",
        variant: "destructive",
      })
    } finally {
      console.log('Signup process completed, resetting loading state')
      setIsLoading(false)
    }
  }

  const handleMergeData = (merge: boolean) => {
    if (!merge) {
      clearCart()
      clearWishlist()
    }
    // If merge = true, the data stays in local storage and will be handled by the app
    
    setShowMergePrompt(false)
    onClose()
    
    toast({
      title: merge ? "Data merged!" : "Welcome!",
      description: merge 
        ? "Your cart and wishlist have been preserved."
        : "You're now logged in.",
    })
  }

  if (showMergePrompt) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Merge your data?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You have items in your cart and wishlist. Would you like to keep them?
            </p>
            <div className="flex space-x-3">
              <Button onClick={() => handleMergeData(true)} className="flex-1">
                Keep my items
              </Button>
              <Button variant="outline" onClick={() => handleMergeData(false)} className="flex-1">
                Start fresh
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to JOMIO</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  required
                  value={signupData.fullName}
                  onChange={(e) => setSignupData(prev => ({ ...prev, fullName: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  required
                  value={signupData.phoneNumber}
                  onChange={(e) => setSignupData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="signupEmail">Email</Label>
                <Input
                  id="signupEmail"
                  type="email"
                  required
                  value={signupData.email}
                  onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="signupPassword">Password</Label>
                <Input
                  id="signupPassword"
                  type="password"
                  required
                  value={signupData.password}
                  onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default LoginModal
