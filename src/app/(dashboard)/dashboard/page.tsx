"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, FileText, TrendingUp, Settings, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { FadeIn } from '@/components/animations/FadeIn'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    cvUploaded: false,
    applications: 0,
    evaluated: 0
  })

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Cargar estadísticas reales del usuario
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        const { count: appsCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .neq('status', 'pending_review')
          
        const { count: evaluatedCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        setStats({
          cvUploaded: !!profile,
          applications: appsCount || 0,
          evaluated: evaluatedCount || 0
        })
      }
    }
    getUser()
  }, [])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        {/* Header del Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Bienvenido, {user.user_metadata?.full_name?.split(' ')[0] || 'Usuario'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Aquí tienes un resumen de tu actividad
            </p>
          </div>
          <Button asChild>
            <Link href="/cv-upload">
              <FileText className="mr-2 h-4 w-4" />
              {stats.cvUploaded ? 'Actualizar CV' : 'Subir mi CV'}
            </Link>
          </Button>
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/cv-upload" className="block transition-transform hover:scale-[1.02]">
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CV Cargado</CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.cvUploaded ? 'Activo' : 'Pendiente'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.cvUploaded ? 'Tu CV está listo para usar' : 'Sube tu CV para comenzar'}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/applications" className="block transition-transform hover:scale-[1.02]">
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aplicaciones</CardTitle>
                <Briefcase className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.applications}</div>
                <p className="text-xs text-muted-foreground">
                  Empleos listos o enviados
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/jobs" className="block transition-transform hover:scale-[1.02]">
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Evaluados por IA</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.evaluated}</div>
                <p className="text-xs text-muted-foreground">
                  Empleos rastreados y calificados
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Marcapasos (Progress Tracker) */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Tu Progreso</CardTitle>
            <CardDescription>
              Sigue estos pasos para maximizar tus oportunidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative border-l border-muted-foreground/20 ml-3 md:ml-0 md:border-l-0 md:border-t md:flex md:justify-between md:pt-4 space-y-8 md:space-y-0 pb-4">
              {/* Step 1 */}
              <div className="relative pl-8 md:pl-0 md:flex-1">
                <div className={`absolute -left-1.5 md:left-1/2 md:-translate-x-1/2 md:-top-5.5 w-3 h-3 rounded-full border-2 ${stats.cvUploaded ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'} md:-mt-6`}></div>
                <div className="md:text-center md:px-2">
                  <h4 className={`font-semibold ${stats.cvUploaded ? 'text-primary' : 'text-muted-foreground'}`}>1. Perfil Completado</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.cvUploaded ? 'CV cargado exitosamente.' : 'Sube tu CV para empezar.'}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative pl-8 md:pl-0 md:flex-1">
                <div className={`absolute -left-1.5 md:left-1/2 md:-translate-x-1/2 md:-top-5.5 w-3 h-3 rounded-full border-2 ${stats.evaluated > 0 ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'} md:-mt-6`}></div>
                <div className="md:text-center md:px-2">
                  <h4 className={`font-semibold ${stats.evaluated > 0 ? 'text-primary' : 'text-muted-foreground'}`}>2. Búsqueda de IA</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.evaluated > 0 ? 'La IA ya está evaluando vacantes para ti.' : 'Ve a "Buscar Empleos" para iniciar el rastreo.'}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative pl-8 md:pl-0 md:flex-1">
                <div className={`absolute -left-1.5 md:left-1/2 md:-translate-x-1/2 md:-top-5.5 w-3 h-3 rounded-full border-2 ${stats.applications > 0 ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'} md:-mt-6`}></div>
                <div className="md:text-center md:px-2">
                  <h4 className={`font-semibold ${stats.applications > 0 ? 'text-primary' : 'text-muted-foreground'}`}>3. Aplicaciones Listas</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.applications > 0 ? 'Tienes empleos guardados en Mis Aplicaciones.' : 'Guarda los mejores empleos recomendados.'}
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative pl-8 md:pl-0 md:flex-1">
                <div className="absolute -left-1.5 md:left-1/2 md:-translate-x-1/2 md:-top-5.5 w-3 h-3 rounded-full border-2 bg-background border-muted-foreground md:-mt-6"></div>
                <div className="md:text-center md:px-2">
                  <h4 className="font-semibold text-muted-foreground">4. Postulaciones Enviadas</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Aplica a los empleos listos y registra tus entrevistas.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild variant="outline">
                <Link href="/jobs">Ver Recomendados</Link>
              </Button>
              <Button asChild>
                <Link href="/applications">Mis Aplicaciones</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
