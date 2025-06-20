
import { create } from 'zustand'

interface AppState {
  isSupabaseReady: boolean
  isRecoveringSession: boolean
  setIsSupabaseReady: (isReady: boolean) => void
  setIsRecoveringSession: (isRecovering: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  isSupabaseReady: true,
  isRecoveringSession: false,
  setIsSupabaseReady: (isReady: boolean) => set({ isSupabaseReady: isReady }),
  setIsRecoveringSession: (isRecovering: boolean) => set({ isRecoveringSession: isRecovering }),
}))
