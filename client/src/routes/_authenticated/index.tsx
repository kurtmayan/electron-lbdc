import Overview from "@/pages/app/overview"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/")({
  component: Overview,
})
