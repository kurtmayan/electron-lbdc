import AuthLayout from "@/layouts/auth-layout"
import { authStore } from "@/store/auth/authStore"
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "/",
  }),
  beforeLoad: ({ search }) => {
    const { isAuthenticated } = authStore.getState()
    if (isAuthenticated) {
      throw redirect({ to: search.redirect })
    }
  },
  component: AuthLayout,
})
