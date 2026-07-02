import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CV Inteligente | Tailoring & Tracking',
  description: 'Sistema privado para adaptar y enviar CVs de manera inteligente.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <main className="container animate-fade-in">
          {children}
        </main>
      </body>
    </html>
  )
}
