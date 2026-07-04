import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchRemoteJobs, filterJobsByLocation } from '@/lib/services/jobSearch'
import { calculateJobMatch } from '@/lib/services/jobMatcher'

// Using service role client to bypass RLS for background jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // fallback for local dev if missing
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(req: NextRequest) {
  // Simple auth for cron (in production, use VERCEL_CRON_SECRET)
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Fetch raw jobs from API
    const rawJobs = await fetchRemoteJobs(15) // Limit to 15 for API safety during dev
    let newAutoApplications = 0
    let totalEvaluated = 0

    // 2. Fetch all users with CV data
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, cv_data')
      .not('cv_data', 'is', null)

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No profiles to process' })
    }

    for (const profile of profiles) {
      const userLocation = profile.cv_data.location || 'worldwide'
      const applicableJobs = filterJobsByLocation(rawJobs, userLocation)

      for (const job of applicableJobs) {
        // Ensure job exists in our jobs table
        const { data: existingJob, error: jobErr } = await supabase
          .from('jobs')
          .select('id')
          .eq('external_id', job.id.toString())
          .maybeSingle()

        let dbJobId
        if (!existingJob) {
          const { data: insertedJob, error: insertJobErr } = await supabase.from('jobs').insert({
            title: job.title,
            company: job.company_name,
            location: job.candidate_required_location,
            description: job.description,
            external_id: job.id.toString(),
            url: job.url
          }).select('id').maybeSingle()
          
          if (insertJobErr) {
            console.error('Error inserting job:', insertJobErr.message)
          }
          if (insertedJob) dbJobId = insertedJob.id
        } else {
          dbJobId = existingJob.id
        }

        if (!dbJobId) {
          console.error('Skipping job evaluation because dbJobId could not be obtained (RLS issue?)')
          continue
        }

        // Check if application/evaluation already exists
        const { data: existingApp, error: appErr } = await supabase
          .from('applications')
          .select('id')
          .eq('user_id', profile.user_id)
          .eq('job_id', dbJobId)
          .maybeSingle()

        if (existingApp) {
          continue; // Already processed this job for this user
        }

        // Evaluate match
        const match = await calculateJobMatch(profile.cv_data, job)
        totalEvaluated++

        // Determine status: >90% -> Auto-Apply, otherwise -> Review
        const status = match.score >= 90 ? 'applied_automatically' : 'pending_review'

        const { error: insertAppErr } = await supabase.from('applications').insert({
          user_id: profile.user_id,
          job_id: dbJobId,
          status: status,
          match_score: match.score,
          match_details: match
        })

        if (insertAppErr) {
          console.error('Error inserting application:', insertAppErr.message)
        } else if (status === 'applied_automatically') {
          newAutoApplications++
          // Aquí se integraría lógica para enviar email al usuario (ej: Resend) 
          // indicándole que se ha aplicado automáticamente a esta vacante.
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cron ejecutado con éxito',
      totalEvaluated,
      newAutoApplications
    })

  } catch (error: any) {
    console.error('Cron Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
