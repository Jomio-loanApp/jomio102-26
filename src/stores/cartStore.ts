
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  product_id: string
  quantity: number
  name: string
  price_string: string
  image_url: string | null
}

interface CartState {
  items: CartItem[]
  addItem: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
  getSubtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        set(state => {
          const existingItem = state.items.find(item => item.product_id === product.product_id)
          
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.product_id === product.product_id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            }
          }

          return {
            items: [...state.items, { ...product, quantity }]
          }
        })
      },

      removeItem: (productId) => {
        set(state => ({
          items: state.items.filter(item => item.product_id !== productId)
        }))
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set(state => ({
          items: state.items.map(item =>
            item.product_id === productId
              ? { ...item, quantity }
              : item
          )
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const price = parseFloat(item.price_string.replace(/[^\d.]/g, ''))
          return total + (price * item.quantity)
        }, 0)
      },
    }),
    {
      name: 'jomio-cart',
    }
  )
)
