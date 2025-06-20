
import { create } from 'zustand'

interface NavigationState {
  navigationStack: string[]
  pushToStack: (path: string) => void
  popFromStack: () => string | null
  clearStack: () => void
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  navigationStack: [],
  
  pushToStack: (path: string) => {
    set(state => ({
      navigationStack: [...state.navigationStack, path]
    }))
  },
  
  popFromStack: () => {
    const { navigationStack } = get()
    if (navigationStack.length === 0) return null
    
    const lastPath = navigationStack[navigationStack.length - 1]
    set(state => ({
      navigationStack: state.navigationStack.slice(0, -1)
    }))
    
    return lastPath
  },
  
  clearStack: () => {
    set({ navigationStack: [] })
  }
}))
