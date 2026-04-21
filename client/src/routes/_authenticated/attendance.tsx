import Attendance from "@/pages/app/attendance"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/attendance")({
  component: Attendance,
})
