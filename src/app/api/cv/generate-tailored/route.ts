import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTailoredCVAndLetter } from '@/lib/services/jobMatcher'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { applicationId } = await req.json()

    if (!applicationId) {
      return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 })
    }

    // 1. Fetch application, job, and profile
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*, jobs(*)')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // 2. Generate Tailored CV via Gemini using jobMatcher service
    const tailoredData = await generateTailoredCVAndLetter(profile.cv_data, application.jobs)

    if (!tailoredData || !tailoredData.cv_adaptado) {
      return NextResponse.json({ error: 'Failed to generate tailored CV' }, { status: 500 })
    }

    // 3. Update application with new match_details and status
    const currentMatchDetails = application.match_details || {}
    const newMatchDetails = {
      ...currentMatchDetails,
      tailored_cv: tailoredData.cv_adaptado,
      cover_letter: tailoredData.carta
    }

    const { error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'ready_to_apply',
        match_details: newMatchDetails
      })
      .eq('id', application.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error in generate-tailored API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
