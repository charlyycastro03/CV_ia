import { createClient } from '@/lib/supabase/server'
import { CVUpload } from '@/components/cv/CVUpload'
import { CVEditor } from '@/components/cv/CVEditor'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the profile to check if they have uploaded a CV
  const { data: profile } = await supabase
    .from('profiles')
    .select('cv_data, cv_url')
    .eq('user_id', user.id)
    .single()

  // We'll make a client wrapper component to handle state swapping 
  // without needing a full reload, but for simplicity we can use a client component
  // Actually, we'll just render a wrapper that handles it.
  
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Sube tu currículum original y revisa la información extraída.
        </p>
      </div>

      <ProfileContainer initialProfile={profile} />
    </div>
  )
}

import { ProfileContainer } from './ProfileContainer'
