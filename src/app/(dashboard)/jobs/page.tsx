import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Briefcase } from 'lucide-react'
import { SyncJobsButton } from '@/components/jobs/SyncJobsButton'
import { JobsList } from '@/components/jobs/JobsList'

export const dynamic = 'force-dynamic'

export default async function JobsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch evaluated jobs for this user
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      *,
      jobs (*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'pending_review')
    .order('match_score', { ascending: false })

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empleos Recomendados</h1>
          <p className="text-muted-foreground mt-2">
            Ofertas filtradas y evaluadas automáticamente por nuestra IA contra tu currículum.
          </p>
        </div>
        
        <SyncJobsButton />
      </div>

      {(!applications || applications.length === 0) ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-muted/20">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Aún no hay empleos evaluados</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Haz clic en "Buscar Nuevas Ofertas" para que la Inteligencia Artificial rastree el mercado global y encuentre los trabajos que mejor hagan match con tu perfil.
          </p>
        </div>
      ) : (
        <JobsList initialApplications={applications} />
      )}
    </div>
  )
}
