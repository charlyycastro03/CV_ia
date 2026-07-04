import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Briefcase } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ApplicationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch applications
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      application_method,
      applied_at,
      jobs (
        title,
        company_name,
        location,
        salary,
        type
      )
    `)
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false })

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mis Aplicaciones</h1>
        <p className="text-muted-foreground mt-2">
          Seguimiento de todos los empleos a los que la IA aplicó por ti (Auto) o que están siendo gestionados por nuestro equipo (Asistido).
        </p>
      </div>

      {!applications || applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">Aún no tienes aplicaciones</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Sube tu currículum y deja que la IA empiece a buscar los mejores trabajos para ti automáticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((app: any) => (
            <Card key={app.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{app.jobs?.title}</CardTitle>
                    <CardDescription className="text-base mt-1">
                      {app.jobs?.company_name} • {app.jobs?.location}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${app.application_method === 'auto' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-purple-500/10 text-purple-500'}`}>
                      {app.application_method === 'auto' ? 'Automático' : 'Asistido'}
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                      {app.status === 'applied_automatically' || app.status === 'applied' || app.status === 'submitted_by_team' ? 'Aplicado' : 
                       app.status === 'ready_to_apply' ? 'Listo para enviar' :
                       app.status === 'pending_review' ? 'En revisión' :
                       app.status === 'needs_candidate_info' ? 'Falta Info' : app.status}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ingresado el {new Date(app.applied_at || app.created_at || new Date()).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
