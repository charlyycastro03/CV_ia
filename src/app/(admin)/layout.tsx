import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ReactNode } from 'react'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="text-lg font-bold text-destructive">Admin Panel</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/users" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
            Usuarios
          </Link>
          <Link href="/admin/metrics" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
            Métricas
          </Link>
        </nav>
        <div className="p-4 border-t border-border">
          <div className="text-sm font-medium truncate">{user.email}</div>
          <Link href="/dashboard" className="text-xs text-primary hover:underline mt-2 block">
            Volver a App
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-end px-8 border-b border-border bg-background">
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
