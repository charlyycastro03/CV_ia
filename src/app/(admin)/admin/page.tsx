import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, Briefcase } from 'lucide-react'
import { SlideIn } from '@/components/animations/SlideIn'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = createClient()

  // Traer métricas globales
  // 1. Usuarios totales
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  // 2. CVs subidos
  const { count: totalCVs } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .not('cv_data', 'is', null)

  // 3. Empleos Totales y Evaluaciones
  const { count: totalJobs } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })

  const { data: applications } = await supabase
    .from('applications')
    .select('id, status, application_method')

  const { count: autoApplied } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ready_to_apply')

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard General (Admin)</h1>
        <p className="text-muted-foreground mt-2">
          Vista panorámica del rendimiento del SaaS.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aplicaciones Automáticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications?.filter(a => a.application_method === 'auto').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aplicaciones Asistidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications?.filter(a => a.application_method === 'assisted').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Listas para enviar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications?.filter(a => a.status === 'ready_to_apply' || a.status === 'applied_automatically').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Revisión (Humano)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications?.filter(a => a.status === 'pending_review' || a.status === 'needs_candidate_info').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SlideIn delay={0.1}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">{totalUsers || 0}</div>
            </CardContent>
          </Card>
        </SlideIn>

        <SlideIn delay={0.2}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CVs Procesados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">{totalCVs || 0}</div>
            </CardContent>
          </Card>
        </SlideIn>

        <SlideIn delay={0.3}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trabajos Ingresados</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">{totalJobs || 0}</div>
            </CardContent>
          </Card>
        </SlideIn>

        <SlideIn delay={0.4}>
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Alta Compatibilidad</CardTitle>
              <Briefcase className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-primary">{autoApplied || 0}</div>
              <p className="text-xs text-primary/80 mt-1">de {applications?.length || 0} evaluaciones totales</p>
            </CardContent>
          </Card>
        </SlideIn>
      </div>
    </div>
  )
}
