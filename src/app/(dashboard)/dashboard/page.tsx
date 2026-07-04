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
    matches: 0
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
          
        const { count: matchesCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('match_score', 80)

        setStats({
          cvUploaded: !!profile,
          applications: appsCount || 0,
          matches: matchesCount || 0
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
          <Card>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aplicaciones</CardTitle>
              <Briefcase className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.applications}</div>
              <p className="text-xs text-muted-foreground">
                Empleos a los que has aplicado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Matches</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.matches}</div>
              <p className="text-xs text-muted-foreground">
                Empleos con más de 80% de match
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accede a las funciones principales de la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Link href="/applications" className="group">
              <Card className="border-primary/20 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Briefcase className="h-8 w-8 text-primary" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <CardTitle className="mt-4">Mis Aplicaciones</CardTitle>
                  <CardDescription>
                    Revisa y da seguimiento a los empleos a los que has aplicado
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/settings" className="group">
              <Card className="border-primary/20 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Settings className="h-8 w-8 text-primary" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <CardTitle className="mt-4">Configuración</CardTitle>
                  <CardDescription>
                    Personaliza tu experiencia y preferencias
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
