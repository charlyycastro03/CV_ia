import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { ReviewForm } from '@/components/admin/ReviewForm'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ReviewApplicationPage({ params }: { params: { id: string } }) {
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

  const { data: application } = await supabase
    .from('applications')
    .select(`
      *,
      jobs ( * ),
      profiles ( cv_data )
    `)
    .eq('id', params.id)
    .single()

  if (!application) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/review" className="text-sm flex items-center text-muted-foreground hover:text-primary">
        <ChevronLeft className="w-4 h-4 mr-1" /> Volver a Bandeja
      </Link>
      
      <ReviewForm application={application} />
    </div>
  )
}
