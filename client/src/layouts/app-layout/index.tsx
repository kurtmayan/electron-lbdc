import Sidebar from "@/components/custom/side-bar"
import TopBar from "@/components/custom/top-bar"
import { Toaster } from "@/components/ui/sonner"
import { Outlet } from "@tanstack/react-router"

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-row bg-[#F4F6F8]">
      <Sidebar />
      <main className="w-full p-5">
        <TopBar />
        <Outlet />
        <Toaster />
      </main>
    </div>
  )
}
