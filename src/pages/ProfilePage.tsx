
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, MapPin, Package, LogOut, Edit } from 'lucide-react'

const ProfilePage = () => {
  const { user, profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  if (!user) {
    navigate('/')
    return null
  }

  const menuItems = [
    {
      icon: Package,
      title: 'Order History',
      description: 'View your past orders and track current ones',
      path: '/profile/orders'
    },
    {
      icon: MapPin,
      title: 'Saved Addresses',
      description: 'Manage your delivery addresses',
      path: '/profile/addresses'
    },
    {
      icon: Edit,
      title: 'Edit Profile',
      description: 'Update your personal information',
      path: '/profile/edit'
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">{profile?.full_name || 'User'}</CardTitle>
                  <p className="text-gray-600">{user.email}</p>
                  {profile?.phone_number && (
                    <p className="text-gray-600">{profile.phone_number}</p>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Menu Items */}
          <div className="grid gap-4">
            {menuItems.map((item) => (
              <Card key={item.path} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent 
                  className="p-6"
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <div className="text-gray-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sign Out */}
          <Card>
            <CardContent className="p-6">
              <Button
                onClick={handleSignOut}
                disabled={isSigningOut}
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
