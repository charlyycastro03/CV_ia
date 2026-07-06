import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Briefcase, MapPin, Building, ExternalLink } from 'lucide-react'
import { ScoreGauge } from '@/components/ui/score-gauge'
import { GenerateCVButton } from '@/components/applications/GenerateCVButton'
import { Button } from '@/components/ui/button'

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
      match_score,
      match_details,
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
          Seguimiento de todos los empleos a los que la IA aplicó por ti (Auto) o que guardaste para revisión (Asistido).
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
            <h3 className="text-xl font-bold mb-2">Aún no tienes aplicaciones guardadas</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Revisa los "Empleos Recomendados" y presiona "Guardar" en los que te interesen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {applications.map((app: any) => {
            const score = app.match_score || 0
            const isAutoApplied = app.application_method === 'auto'
            let borderStyle = 'border-border'
            if (isAutoApplied) borderStyle = 'border-primary/50 bg-primary/5'

            return (
              <Card key={app.id} className={`overflow-hidden transition-all duration-200 border-2 ${borderStyle}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold">{app.jobs?.title}</CardTitle>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center"><Building className="w-4 h-4 mr-1"/> {app.jobs?.company_name}</span>
                        <span className="flex items-center"><MapPin className="w-4 h-4 mr-1"/> {app.jobs?.location}</span>
                        {(app.jobs?.salary_min || app.jobs?.salary_max) && (
                          <span className="block text-sm">
                            💰 {app.jobs.salary_min ? `$${app.jobs.salary_min.toLocaleString()}` : ''}
                            {app.jobs.salary_min && app.jobs.salary_max ? ' - ' : ''}
                            {app.jobs.salary_max ? `$${app.jobs.salary_max.toLocaleString()}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${app.application_method === 'auto' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-purple-500/10 text-purple-500'}`}>
                          {app.application_method === 'auto' ? 'Automático' : 'Guardado Manual'}
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                          {app.status === 'applied_automatically' || app.status === 'applied' || app.status === 'submitted_by_team' ? 'Aplicado' : 
                          app.status === 'ready_to_apply' ? 'Listo para enviar' : app.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Score</span>
                        <ScoreGauge value={score} size={40} delay={0} />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardFooter className="flex justify-between border-t border-border bg-muted/20 pt-4 mt-4">
                  <p className="text-xs text-muted-foreground">
                    Guardado el {new Date(app.applied_at || new Date()).toLocaleDateString()}
                  </p>
                  
                  <div className="flex gap-2">
                    {app.status === 'ready_to_apply' && app.match_details?.tailored_cv && (
                      <a 
                        href={`/api/cv/download/${app.id}`} 
                        download="CV_Adaptado.pdf"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                      >
                        Descargar CV Sugerido
                      </a>
                    )}

                    {app.status === 'ready_to_apply' && !app.match_details?.tailored_cv && (
                      <GenerateCVButton applicationId={app.id} />
                    )}

                    <a href={app.jobs?.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        Ver Vacante <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
