"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Briefcase, User as UserIcon, LogOut } from "lucide-react"
import { User } from "@supabase/supabase-js"

interface SidebarProps {
  user: User | null
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { name: "Inicio", href: "/dashboard", icon: Home },
    { name: "Buscar Empleos", href: "/jobs", icon: Search },
    { name: "Mis Aplicaciones", href: "/applications", icon: Briefcase },
    { name: "Mi CV", href: "/cv-upload", icon: UserIcon },
  ]

  return (
    <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <span className="text-xl font-bold text-primary">CV Automation</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-sm font-medium truncate mb-2">{user?.email}</div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-destructive transition-colors w-full text-left">
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
