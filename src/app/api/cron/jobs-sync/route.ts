import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchRemoteJobs, filterJobsByLocation } from '@/lib/services/jobSearch'
import { fetchGreenhouseJobs } from '@/lib/sources/greenhouse'
import { fetchLeverJobs } from '@/lib/sources/lever'
import { fetchAdzunaJobs } from '@/lib/sources/adzuna'
import { calculateJobMatch, generateTailoredCVAndLetter } from '@/lib/services/jobMatcher'
import { sendAutoApplication } from '@/lib/services/autoApply'

// Using service role client to bypass RLS for background jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // fallback for local dev if missing
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const maxDuration = 60; // Max execution time for the cron job (in seconds)

export async function GET(req: NextRequest) {
  // Simple auth for cron (in production, use VERCEL_CRON_SECRET)
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.time('fetchExternalSources')
    // 1. Fetch from all sources in parallel
    const [
      remotiveRes,
      greenhouseDiscordRes,
      greenhouseTwitchRes,
      leverRes,
      adzunaRes
    ] = await Promise.allSettled([
      fetchRemoteJobs(10),
      fetchGreenhouseJobs('discord'),
      fetchGreenhouseJobs('twitch'),
      fetchLeverJobs('lever'),
      fetchAdzunaJobs('software engineer', 'us')
    ])
    console.timeEnd('fetchExternalSources')

    // Extraemos resultados, manejando posibles rechazos
    const rawRemotive = remotiveRes.status === 'fulfilled' ? remotiveRes.value : []
    const rawGreenhouse = greenhouseDiscordRes.status === 'fulfilled' ? greenhouseDiscordRes.value : []
    const rawGreenhouse2 = greenhouseTwitchRes.status === 'fulfilled' ? greenhouseTwitchRes.value : []
    const rawLever = leverRes.status === 'fulfilled' ? leverRes.value : []
    const rawAdzuna = adzunaRes.status === 'fulfilled' ? adzunaRes.value : []

    // Map remotive to standard internal format
    const remotiveJobs = rawRemotive.map((j: any) => ({
      source: 'remotive',
      external_id: String(j.id),
      company_name: j.company_name,
      title: j.title,
      location: j.candidate_required_location,
      description: j.description,
      url: j.url,
      raw: j
    }))

    const greenhouseJobs = rawGreenhouse.map((j: any) => ({ ...j, company_name: j.company, url: j.apply_url }))
    const greenhouseJobs2 = rawGreenhouse2.map((j: any) => ({ ...j, company_name: j.company, url: j.apply_url }))
    const leverJobs = rawLever.map((j: any) => ({ ...j, company_name: j.company, url: j.apply_url }))
    const adzunaJobs = rawAdzuna.map((j: any) => ({ ...j, company_name: j.company, url: j.apply_url }))

    const allRawJobs = [...remotiveJobs, ...greenhouseJobs, ...greenhouseJobs2, ...leverJobs, ...adzunaJobs]
    
    let newAutoApplications = 0
    let totalEvaluated = 0
    let debugErrors: string[] = []

    // Daily limit config
    const DAILY_LIMIT = 10;

    const MAX_PROFILES_PER_RUN = 5;
    const MAX_EVALUATIONS_PER_RUN = 30;

    // 2. Fetch all users with CV data, order by least recently matched
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('user_id, cv_data, last_matched_at')
      .not('cv_data', 'is', null)
      .order('last_matched_at', { ascending: true, nullsFirst: true })
      .limit(MAX_PROFILES_PER_RUN)

    if (profileErr) {
      debugErrors.push('Error fetching profiles: ' + profileErr.message)
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No profiles to process', errors: debugErrors })
    }

    let profilesProcessed: string[] = []

    for (const profile of profiles) {
      if (totalEvaluated >= MAX_EVALUATIONS_PER_RUN) {
         debugErrors.push(`Reached global limit of ${MAX_EVALUATIONS_PER_RUN} evaluations this run. Stopping early.`)
         break;
      }
      
      const userLocation = profile.cv_data.location || 'worldwide'
      
      // Filter location for remotive specifically, others are already globally queried or US specific
      const applicableJobs = allRawJobs.filter((job: any) => {
        if (job.source === 'remotive') {
          return filterJobsByLocation([job.raw], userLocation).length > 0;
        }
        return true;
      })
      
      if (applicableJobs.length === 0) {
         debugErrors.push(`No applicable jobs for location: ${userLocation}`)
         continue;
      }

      // Check daily limit for auto applications
      const today = new Date()
      today.setHours(0,0,0,0)
      const { count: appliedToday } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.user_id)
        .eq('application_method', 'auto')
        .eq('status', 'applied_automatically')
        .gte('applied_at', today.toISOString())
      
      let localAppliedToday = appliedToday || 0;

      for (const job of applicableJobs) {
        if (totalEvaluated >= MAX_EVALUATIONS_PER_RUN) {
           debugErrors.push(`Reached global limit of ${MAX_EVALUATIONS_PER_RUN} evaluations this run inside loop.`)
           break;
        }

        // Ensure job exists in our jobs table
        const { data: upsertedJob, error: upsertErr } = await supabase
          .from('jobs')
          .upsert(
            {
              title: job.title,
              company_name: job.company_name,
              location: job.location,
              description: job.description,
              external_id: job.external_id,
              url: job.url,
              source: job.source
            },
            { onConflict: 'source,external_id', ignoreDuplicates: false }
          )
          .select('id')
          .single()

        let dbJobId = upsertedJob?.id
        if (upsertErr) {
          debugErrors.push(`Error upserting job ${job.source}:${job.external_id}: ` + upsertErr.message)
          console.error('Error upserting job:', upsertErr.message)
        }

        if (!dbJobId) {
          debugErrors.push('Skipping job evaluation because dbJobId could not be obtained')
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

        if (appErr) debugErrors.push('Error checking existing app: ' + appErr.message)

        if (existingApp) {
          continue; // Already processed this job for this user
        }

        totalEvaluated++
        console.time(`calculateJobMatch-${profile.user_id}-${job.title.substring(0,10)}`)
        const match = await calculateJobMatch(profile.cv_data, job)
        console.timeEnd(`calculateJobMatch-${profile.user_id}-${job.title.substring(0,10)}`)
        
        if (!match) continue;

        await supabase.from('application_logs').insert({
          application_id: null,
          status: 'evaluated',
          notes: `Evaluated job ${job.title} for user ${profile.user_id}. Score: ${match.score}`
        })

        // Routing Rule: >= 90 AND source is known to have auto-apply capacity (Greenhouse, Lever) -> Track A
        // Else -> Track B (pending_review)
        let isAutoEligible = match.score >= 90 && (job.source === 'greenhouse' || job.source === 'lever')
        
        let status = isAutoEligible ? 'applied_automatically' : 'pending_review'
        let applicationMethod = isAutoEligible ? 'auto' : 'assisted'
        
        let tailoredCv = profile.cv_data // Default
        let coverLetter = ''

        if (isAutoEligible) {
          if (localAppliedToday >= DAILY_LIMIT) {
             status = 'ready_to_apply'
             debugErrors.push(`User ${profile.user_id} reached auto-apply daily limit. Job ${job.title} set to ready_to_apply.`)
          } else {
            console.time(`generateTailoredCV-${profile.user_id}-${job.title.substring(0,10)}`)
            const tailoredResult = await generateTailoredCVAndLetter(profile.cv_data, job)
            console.timeEnd(`generateTailoredCV-${profile.user_id}-${job.title.substring(0,10)}`)
            
            tailoredCv = tailoredResult.cv_adaptado
            coverLetter = tailoredResult.carta

            // Attempt auto apply
            const applyResult = await sendAutoApplication(job, profile.cv_data, tailoredCv, coverLetter)
            
            if (!applyResult.success) {
              // Fallback to ready_to_apply if auto-apply fails (e.g. no email found)
              status = 'ready_to_apply'
              debugErrors.push(`Auto-apply failed for job ${job.title}: ${applyResult.error}`)
            } else {
              newAutoApplications++
              localAppliedToday++
            }
          }
        }

        const { data: appData, error: insertAppErr } = await supabase.from('applications').insert({
          user_id: profile.user_id,
          job_id: dbJobId,
          status: status,
          application_method: applicationMethod,
          match_score: match.score,
          match_details: match,
          applied_at: new Date().toISOString()
        }).select('id').maybeSingle()

        if (insertAppErr) {
          debugErrors.push('Error inserting application (RLS?): ' + insertAppErr.message)
          console.error('Error inserting application:', insertAppErr.message)
        } else if (appData) {
          // Log insertion
          await supabase.from('application_logs').insert({
            application_id: appData.id,
            status: status,
            notes: `Application routed to ${applicationMethod} with status ${status}.`
          })
        }
      } // end job loop
      
      profilesProcessed.push(profile.user_id)
    } // end profile loop

    // 3. Update last_matched_at for processed profiles
    if (profilesProcessed.length > 0) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ last_matched_at: new Date().toISOString() })
        .in('user_id', profilesProcessed)
        
      if (updateErr) {
        debugErrors.push('Error updating last_matched_at: ' + updateErr.message)
      }
    }

    return NextResponse.json({ 
      success: true,
      totalEvaluated, 
      newAutoApplications,
      profilesProcessed: profilesProcessed.length,
      errors: debugErrors 
    })

  } catch (error: any) {
    console.error('Cron Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
