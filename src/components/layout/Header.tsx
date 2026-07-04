"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { User } from "@supabase/supabase-js"

interface HeaderProps {
  user: User | null
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between md:justify-end px-4 md:px-8 border-b border-border bg-background">
      {/* Mobile Title (only visible on small screens) */}
      <div className="md:hidden">
        <span className="text-lg font-bold text-primary">CV Automation</span>
      </div>

      <div className="flex items-center space-x-3">
        <ThemeToggle />
        <Button variant="outline" size="icon" className="rounded-full w-9 h-9 relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
        </Button>
      </div>
    </header>
  )
}
