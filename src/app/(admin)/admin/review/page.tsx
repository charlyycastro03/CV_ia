import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Clock, AlertCircle } from 'lucide-react'

export default async function ReviewInboxPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // Fetch pending review applications
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      application_method,
      match_score,
      applied_at,
      jobs ( title, company_name ),
      users ( email, name )
    `)
    .in('status', ['pending_review', 'needs_candidate_info'])
    .order('match_score', { ascending: false })

  if (error) {
    console.error('Error fetching review inbox:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bandeja de Revisión</h2>
          <p className="text-muted-foreground mt-2">
            Candidatos asistidos pendientes de revisión manual por el equipo.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Pendientes ({applications?.length || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications && applications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Vacante</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app: any) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="font-medium">{app.users?.name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{app.users?.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{app.jobs?.title}</div>
                      <div className="text-sm text-muted-foreground">{app.jobs?.company_name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={app.match_score >= 80 ? 'default' : 'secondary'}>
                        {app.match_score}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={app.status === 'needs_candidate_info' ? 'destructive' : 'outline'}>
                        {app.status === 'needs_candidate_info' ? 'Falta Info' : 'Por Revisar'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/review/${app.id}`}>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Revisar
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Bandeja Vacía</h3>
              <p className="text-muted-foreground">No hay aplicaciones pendientes de revisión.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
