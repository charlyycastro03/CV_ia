import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, CheckCircle, Target, TrendingUp, Briefcase } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'
import { SlideIn } from '@/components/animations/SlideIn'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Verificar si el usuario tiene CV
  const { data: profile } = await supabase
    .from('profiles')
    .select('cv_data, updated_at')
    .eq('user_id', user.id)
    .single()

  const hasCV = !!profile?.cv_data

  // 2. Traer métricas
  const { data: applications } = await supabase
    .from('applications')
    .select('id, match_score, status, jobs(title, company), created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const totalEvaluated = applications?.length || 0
  const autoApplied = applications?.filter(a => a.status === 'applied_automatically').length || 0
  
  const totalScore = applications?.reduce((acc, curr) => acc + (curr.match_score || 0), 0) || 0
  const avgScore = totalEvaluated > 0 ? Math.round(totalScore / totalEvaluated) : 0

  const recentApplications = applications?.slice(0, 3) || []

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido, {user.user_metadata?.full_name?.split(' ')[0] || 'Usuario'} 👋</h1>
          <p className="text-muted-foreground mt-2">
            Este es tu resumen de actividad en la plataforma de automatización de CVs.
          </p>
        </div>
      </FadeIn>

      {!hasCV && (
        <SlideIn delay={0.1}>
          <div className="bg-primary/10 border-l-4 border-primary p-6 rounded-r-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-primary flex items-center">
                <FileText className="w-5 h-5 mr-2" /> 
                Aún no has configurado tu perfil
              </h3>
              <p className="text-primary/80 mt-1">
                Para que la Inteligencia Artificial pueda empezar a buscar empleos y aplicar por ti, necesitas subir tu CV en formato PDF.
              </p>
            </div>
            <Link href="/profile">
              <Button size="lg" className="whitespace-nowrap shadow-lg">
                Subir CV Ahora
              </Button>
            </Link>
          </div>
        </SlideIn>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SlideIn delay={0.2}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empleos Evaluados</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-foreground">{totalEvaluated}</div>
              <p className="text-xs text-muted-foreground mt-1">ofertas analizadas por la IA</p>
            </CardContent>
          </Card>
        </SlideIn>

        <SlideIn delay={0.3}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aplicaciones Automáticas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-green-500">{autoApplied}</div>
              <p className="text-xs text-muted-foreground mt-1">con >90% de coincidencia</p>
            </CardContent>
          </Card>
        </SlideIn>

        <SlideIn delay={0.4}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Match Score Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-foreground">{avgScore}%</div>
              <p className="text-xs text-muted-foreground mt-1">nivel de compatibilidad global</p>
            </CardContent>
          </Card>
        </SlideIn>
      </div>

      {/* Actividad Reciente */}
      <SlideIn delay={0.5}>
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Actividad Reciente</h2>
            <Link href="/jobs">
              <Button variant="ghost" size="sm">Ver todos</Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {recentApplications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No hay actividad reciente.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentApplications.map((app: any) => (
                    <div key={app.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{app.jobs.title}</p>
                          <p className="text-sm text-muted-foreground">{app.jobs.company}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${app.match_score >= 90 ? 'text-green-500' : ''}`}>
                          {app.match_score}% Match
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SlideIn>
    </div>
  )
}
