"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Settings, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

interface HeaderProps {
  user: any
}

export function Header({ user }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <div className="mr-4 hidden md:flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-primary text-lg">CV IA</span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span className="sr-only">Cambiar tema</span>
          </Button>

          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Configuración</span>
            </Button>
          </Link>

          {user && (
            <div className="flex items-center space-x-2 ml-2">
              <span className="text-sm text-muted-foreground hidden md:inline">
                {user.email}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
