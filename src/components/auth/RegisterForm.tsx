"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'
import Link from 'next/link'

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const validatePassword = (pwd: string) => {
    const minLength = pwd.length >= 8
    const hasUppercase = /[A-Z]/.test(pwd)
    const hasLowercase = /[a-z]/.test(pwd)
    const hasNumber = /[0-9]/.test(pwd)
    
    return {
      valid: minLength && hasUppercase && hasLowercase && hasNumber,
      requirements: {
        minLength,
        hasUppercase,
        hasLowercase,
        hasNumber
      }
    }
  }

  const passwordValidation = validatePassword(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validaciones
    if (!fullName.trim()) {
      setError('Por favor ingresa tu nombre completo')
      setLoading(false)
      return
    }

    if (!age || parseInt(age) < 18 || parseInt(age) > 100) {
      setError('Por favor ingresa una edad válida (18-100)')
      setLoading(false)
      return
    }

    if (!passwordValidation.valid) {
      setError('La contraseña no cumple con los requisitos')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            age: parseInt(age),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setSuccess(true)
      window.location.href = `/auth/verify?email=${encodeURIComponent(email)}`
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <FadeIn>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">¡Registro exitoso!</CardTitle>
            <CardDescription>
              Hemos enviado un correo de verificación a<br />
              <span className="font-semibold text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Por favor revisa tu correo y haz clic en el enlace de verificación para activar tu cuenta.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </FadeIn>
    )
  }

  return (
    <FadeIn>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>
            Ingresa tus datos para comenzar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Edad</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                min="18"
                max="100"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {password && (
                <div className="space-y-1 text-xs">
                  <p className={passwordValidation.requirements.minLength ? 'text-green-500' : 'text-muted-foreground'}>
                    {passwordValidation.requirements.minLength ? '✓' : '○'} Mínimo 8 caracteres
                  </p>
                  <p className={passwordValidation.requirements.hasUppercase ? 'text-green-500' : 'text-muted-foreground'}>
                    {passwordValidation.requirements.hasUppercase ? '✓' : '○'} Una letra mayúscula
                  </p>
                  <p className={passwordValidation.requirements.hasLowercase ? 'text-green-500' : 'text-muted-foreground'}>
                    {passwordValidation.requirements.hasLowercase ? '✓' : '○'} Una letra minúscula
                  </p>
                  <p className={passwordValidation.requirements.hasNumber ? 'text-green-500' : 'text-muted-foreground'}>
                    {passwordValidation.requirements.hasNumber ? '✓' : '○'} Un número
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta'
              )}
            </Button>
            <div className="mt-4 text-center text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Inicia sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </FadeIn>
  )
}
