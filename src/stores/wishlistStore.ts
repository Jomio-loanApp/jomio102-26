
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WishlistItem {
  product_id: string
  name: string
  price_string: string
  image_url: string | null
}

interface WishlistState {
  items: WishlistItem[]
  addItem: (product: WishlistItem) => void
  removeItem: (productId: string) => void
  clearWishlist: () => void
  isInWishlist: (productId: string) => boolean
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        set(state => {
          const exists = state.items.some(item => item.product_id === product.product_id)
          if (exists) return state

          return {
            items: [...state.items, product]
          }
        })
      },

      removeItem: (productId) => {
        set(state => ({
          items: state.items.filter(item => item.product_id !== productId)
        }))
      },

      clearWishlist: () => {
        set({ items: [] })
      },

      isInWishlist: (productId) => {
        return get().items.some(item => item.product_id === productId)
      },
    }),
    {
      name: 'jomio-wishlist',
    }
  )
)
