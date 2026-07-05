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
  const { data: applications, error } = await supabase
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
        salary_min,
        salary_max,
        type,
        url
      )
    `)
    .eq('user_id', user.id)
    .neq('status', 'pending_review')
    .order('applied_at', { ascending: false })

  if (error) {
    console.error('Error fetching applications:', error.message)
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mis Aplicaciones</h1>
        <p className="text-muted-foreground mt-2">
          Seguimiento de todos los empleos a los que la IA aplicó por ti (Auto) o que están siendo gestionados por nuestro equipo (Asistido).
        </p>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center text-red-700">
            <h3 className="text-xl font-bold mb-2">Error al cargar aplicaciones</h3>
            <p className="max-w-sm mb-6">
              Hubo un problema recuperando tus datos. Por favor, intenta recargar la página en unos momentos.
            </p>
          </CardContent>
        </Card>
      ) : !applications || applications.length === 0 ? (
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
                      {(app.jobs?.salary_min || app.jobs?.salary_max) && (
                        <span className="block text-sm mt-1">
                          💰 {app.jobs.salary_min ? `$${app.jobs.salary_min.toLocaleString()}` : ''}
                          {app.jobs.salary_min && app.jobs.salary_max ? ' - ' : ''}
                          {app.jobs.salary_max ? `$${app.jobs.salary_max.toLocaleString()}` : ''}
                        </span>
                      )}
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
              <CardContent className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Ingresado el {new Date(app.applied_at || app.created_at || new Date()).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  {app.status === 'ready_to_apply' && (
                    <a 
                      href={`/api/cv/download/${app.id}`} 
                      download="CV_Adaptado.pdf"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3 text-xs"
                    >
                      Descargar CV Sugerido
                    </a>
                  )}
                  {app.jobs?.url && (
                    <a 
                      href={app.jobs.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 text-xs"
                    >
                      Ver Vacante Original
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
