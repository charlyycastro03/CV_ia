"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Mail, CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/animations/FadeIn'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email')
  const [isChecking, setIsChecking] = useState(true)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    const checkVerification = async () => {
      // Verificar cada 3 segundos si el email fue confirmado
      const interval = setInterval(async () => {
        try {
          const res = await fetch('/api/auth/check-verification')
          if (res.ok) {
            const data = await res.json()
            if (data.verified) {
              setIsVerified(true)
              clearInterval(interval)
              setTimeout(() => {
                router.push('/dashboard')
              }, 2000)
            }
          }
        } catch (error) {
          console.error('Error checking verification:', error)
        }
      }, 3000)

      // Detener después de 5 minutos
      setTimeout(() => {
        clearInterval(interval)
        setIsChecking(false)
      }, 300000)
    }

    checkVerification()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <FadeIn>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Verifica tu correo</CardTitle>
            <CardDescription>
              {email && (
                <>
                  Hemos enviado un enlace de verificación a<br />
                  <span className="font-semibold text-foreground">{email}</span>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isChecking && !isVerified && (
              <div className="flex flex-col items-center space-y-3 py-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground text-center">
                  Esperando confirmación de tu correo...
                </p>
              </div>
            )}
            
            {isVerified && (
              <div className="flex flex-col items-center space-y-3 py-4">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <p className="text-lg font-semibold text-green-500">
                  ¡Correo verificado exitosamente!
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirigiendo al dashboard...
                </p>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">¿No recibiste el correo?</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Revisa tu carpeta de spam</li>
                <li>• Espera unos minutos</li>
                <li>• Verifica que el correo sea correcto</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
