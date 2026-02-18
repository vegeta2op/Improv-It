import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  email: string
  full_name?: string
  role?: string
  is_active: boolean
  created_at: string
  last_login?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  accessToken: string | null
  theme: 'light' | 'dark'
  _hasHydrated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      theme: 'light',
      _hasHydrated: false,
      setAuth: (user, accessToken) => {
        localStorage.setItem('access_token', accessToken)
        set({ isAuthenticated: true, user, accessToken })
      },
      logout: () => {
        localStorage.removeItem('access_token')
        set({ isAuthenticated: false, user: null, accessToken: null })
      },
      setTheme: (theme) => set({ theme }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
