
import { create } from 'zustand'

interface LocationState {
  deliveryLat: number | null
  deliveryLng: number | null
  deliveryLocationName: string
  setDeliveryLocation: (lat: number, lng: number, locationName: string) => void
  clearDeliveryLocation: () => void
}

export const useLocationStore = create<LocationState>((set) => ({
  deliveryLat: null,
  deliveryLng: null,
  deliveryLocationName: '',
  
  setDeliveryLocation: (lat: number, lng: number, locationName: string) => {
    console.log('LocationStore: Setting delivery location:', { lat, lng, locationName })
    set({ deliveryLat: lat, deliveryLng: lng, deliveryLocationName: locationName })
  },
  
  clearDeliveryLocation: () => {
    console.log('LocationStore: Clearing delivery location')
    set({ deliveryLat: null, deliveryLng: null, deliveryLocationName: '' })
  }
}))
