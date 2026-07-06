import { ReactNode } from 'react'
import { AmbientBackground } from '@/components/layout/AmbientBackground'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative z-0">
      <AmbientBackground />
      {children}
    </div>
  )
}
