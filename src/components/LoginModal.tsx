
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

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
  const [error, setError] = useState<string | null>(null)

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
    setError(null)

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
      setError(error.message || "An error occurred during login")
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
    setError(null)

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
      setError(error.message || "An error occurred during signup")
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
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span>Merge your data?</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                You have items in your cart and wishlist. Would you like to keep them?
              </p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700">
                  {cartItems.length > 0 && `${cartItems.length} item${cartItems.length > 1 ? 's' : ''} in cart`}
                  {cartItems.length > 0 && wishlistItems.length > 0 && ' • '}
                  {wishlistItems.length > 0 && `${wishlistItems.length} item${wishlistItems.length > 1 ? 's' : ''} in wishlist`}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => handleMergeData(true)} className="flex-1 bg-green-600 hover:bg-green-700">
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
          <DialogTitle className="text-center text-xl font-semibold">Welcome to JOMIO</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isLoading}
                  className="focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={isLoading}
                  className="focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  required
                  value={signupData.fullName}
                  onChange={(e) => setSignupData(prev => ({ ...prev, fullName: e.target.value }))}
                  disabled={isLoading}
                  className="focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Enter your phone number"
                  required
                  value={signupData.phoneNumber}
                  onChange={(e) => setSignupData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  disabled={isLoading}
                  className="focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signupEmail">Email</Label>
                <Input
                  id="signupEmail"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={signupData.email}
                  onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isLoading}
                  className="focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signupPassword">Password</Label>
                <Input
                  id="signupPassword"
                  type="password"
                  placeholder="Create a password"
                  required
                  value={signupData.password}
                  onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={isLoading}
                  className="focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default LoginModal
