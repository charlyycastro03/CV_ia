import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { PageTransition } from '@/components/animations/PageTransition'
import { AmbientBackground } from '@/components/layout/AmbientBackground'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex bg-background pb-16 md:pb-0 relative z-0">
      <AmbientBackground />
      {/* Desktop Sidebar */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen">
        <Header user={user} />
        
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <MobileNav />
    </div>
  )
}

