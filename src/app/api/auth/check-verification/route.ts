import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ verified: false }, { status: 401 })
  }

  return NextResponse.json({
    verified: !!user.email_confirmed_at
  })
}
