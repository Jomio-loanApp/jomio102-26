
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LocationState {
  deliveryLat: number | null
  deliveryLng: number | null
  deliveryLocationName: string
  isLocationSelected: boolean
  setDeliveryLocation: (lat: number, lng: number, locationName: string) => void
  clearDeliveryLocation: () => void
  hasLocationPermission: boolean
  setLocationPermission: (hasPermission: boolean) => void
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      deliveryLat: null,
      deliveryLng: null,
      deliveryLocationName: '',
      isLocationSelected: false,
      hasLocationPermission: false,
      
      setDeliveryLocation: (lat: number, lng: number, locationName: string) => {
        console.log('LocationStore: Setting delivery location:', { lat, lng, locationName })
        set({ 
          deliveryLat: lat, 
          deliveryLng: lng, 
          deliveryLocationName: locationName,
          isLocationSelected: true 
        })
      },
      
      clearDeliveryLocation: () => {
        console.log('LocationStore: Clearing delivery location')
        set({ 
          deliveryLat: null, 
          deliveryLng: null, 
          deliveryLocationName: '',
          isLocationSelected: false 
        })
      },

      setLocationPermission: (hasPermission: boolean) => {
        set({ hasLocationPermission: hasPermission })
      }
    }),
    {
      name: 'jomio-location',
    }
  )
)
