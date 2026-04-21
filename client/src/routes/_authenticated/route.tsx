import AppLayout from "@/layouts/app-layout"
import { authStore } from "@/store/auth/authStore"
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    const isAuthenticated = authStore.getState().isAuthenticated
    if (!isAuthenticated) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AppLayout,
})
