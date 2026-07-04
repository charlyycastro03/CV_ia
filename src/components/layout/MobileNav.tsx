"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Briefcase, User as UserIcon } from "lucide-react"

export function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    { name: "Inicio", href: "/dashboard", icon: Home },
    { name: "Empleos", href: "/jobs", icon: Search },
    { name: "Aplicaciones", href: "/applications", icon: Briefcase },
    { name: "Perfil", href: "/profile", icon: UserIcon },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around z-50 px-2 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className={`h-5 w-5 ${isActive ? "fill-primary/20" : ""}`} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
