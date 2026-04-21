import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Credentials = {
  email: string
  password: string
}

export type AuthStore = {
  isAuthenticated: boolean
  token: string | null
  login: (token: string) => void
  logout: () => void
}

export const authStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      login: (token) => set({ isAuthenticated: true, token }),
      logout: () => set({ isAuthenticated: false, token: null }),
    }),
    { name: "auth" }
  )
)
