import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Link, useLocation } from "@tanstack/react-router"

export type NavLink = {
  label: string
  url: string
}

export default function Sidebar() {
  const { pathname } = useLocation()

  const navLinks: NavLink[] = [
    { label: "overview", url: "/" },
    { label: "attendance", url: "/attendance" },
  ]

  return (
    <div className="bg-[#2C3E50]">
      <div className="sticky top-0 flex h-256 max-h-256 flex-col justify-between gap-5 p-4">
        <div className="flex flex-col gap-5">
          <div className="flex flex-row items-center gap-2">
            <img src="/app-logo.svg" className="size-13" />
            <p className="text-xl font-semibold text-white">LOCAL</p>
          </div>
          <div className="flex w-65 max-w-65 flex-col gap-3 bg-[#2C3E50]">
            {navLinks.map(({ label, url }) => {
              return (
                <Link
                  to={url}
                  key={url}
                  className={cn(
                    "rounded-sm p-2 capitalize",
                    pathname == url ? "bg-primary" : "text-white"
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
        <div className="flex flex-row items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary text-black">
              JL
            </AvatarFallback>
          </Avatar>
          <div className="text-white">
            <p className="text-sm">Juan dela Cruz</p>
            <p className="text-xs">Store Manager</p>
          </div>
        </div>
      </div>
    </div>
  )
}
