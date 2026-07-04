import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, XCircle } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = createClient()

  const { data: users } = await supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      role,
      created_at,
      profiles (
        cv_url
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground mt-2">
          Lista de todos los usuarios registrados en la plataforma.
        </p>
      </div>

      <FadeIn>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Nombre</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Rol</th>
                    <th className="px-6 py-4 font-semibold text-center">Tiene CV</th>
                    <th className="px-6 py-4 font-semibold text-right">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users?.map((u: any) => {
                    // supabase join returns array if one-to-many, but profiles is 1-1, although syntax might return array or object depending on relation
                    const hasCV = Array.isArray(u.profiles) 
                      ? u.profiles.length > 0 && !!u.profiles[0].cv_url
                      : !!u.profiles?.cv_url

                    return (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{u.name || 'Sin Nombre'}</td>
                        <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {hasCV ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-muted-foreground/30" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
