import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchRemoteJobs, filterJobsByLocation, parseAndValidateSalary } from '@/lib/services/jobSearch'
import { fetchGreenhouseJobs } from '@/lib/sources/greenhouse'
import { fetchLeverJobs } from '@/lib/sources/lever'
import { fetchAdzunaJobs } from '@/lib/sources/adzuna'
import { fetchRemoteOKJobs } from '@/lib/sources/remoteok'
import { fetchArbeitnowJobs } from '@/lib/sources/arbeitnow'
import { fetchHimalayasJobs } from '@/lib/sources/himalayas'
import { fetchJobicyJobs } from '@/lib/sources/jobicy'
import { fetchUSAJobs } from '@/lib/sources/usajobs'
import { fetchReedJobs } from '@/lib/sources/reed'
import { fetchAshbyJobs } from '@/lib/sources/ashby'

import { ADZUNA_TARGET_COUNTRIES } from '@/lib/constants/targetRegions'
import { GREENHOUSE_BOARDS, LEVER_BOARDS, ASHBY_BOARDS } from '@/lib/constants/targetCompanies'
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
    let newAutoApplications = 0
    let totalEvaluated = 0
    let debugErrors: string[] = []

    // Daily limit config
    const DAILY_LIMIT = 10;

    const MAX_PROFILES_PER_RUN = 1; // Bajamos a 1 porque ahora se hacen ~27 requests por perfil
    const MAX_EVALUATIONS_PER_RUN = 3;

    // 1. Fetch all users with CV data, order by least recently matched
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
      const userTargetRole = profile.cv_data.target_role || profile.cv_data.title || profile.cv_data.basics?.label || 'software engineer'
      
      // 2. Fetch specific jobs for this user
      console.time(`fetchExternalSources-${profile.user_id}`)
      
      const remotivePromise = fetchRemoteJobs(10, userTargetRole)
      
      // ROTATION STRATEGY: Randomly pick subsets to avoid 60s timeout
      const getSubset = <T>(arr: T[], n: number) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

      const selectedGreenhouse = getSubset(GREENHOUSE_BOARDS, 2);
      const selectedLever = getSubset(LEVER_BOARDS, 1);
      const selectedAshby = getSubset(ASHBY_BOARDS, 1);
      const selectedAdzuna = getSubset(ADZUNA_TARGET_COUNTRIES, 1);
      
      const greenhousePromises = selectedGreenhouse.map(board => fetchGreenhouseJobs(board))
      const leverPromises = selectedLever.map(board => fetchLeverJobs(board))
      const ashbyPromises = selectedAshby.map(board => fetchAshbyJobs(board))
      
      const adzunaPromises = selectedAdzuna.map(country => 
        fetchAdzunaJobs(`${userTargetRole} remote`, country.code, country.salaryMin)
      )

      // Randomly pick 2 from Tier 1
      const tier1Sources = [
        () => fetchRemoteOKJobs(userTargetRole),
        () => fetchArbeitnowJobs(),
        () => fetchHimalayasJobs(),
        () => fetchJobicyJobs()
      ];
      const selectedTier1 = getSubset(tier1Sources, 2).map(fn => fn());

      // Randomly pick 1 from Tier 2
      const tier2Sources = [
        () => fetchUSAJobs(userTargetRole),
        () => fetchReedJobs(userTargetRole)
      ];
      const selectedTier2 = getSubset(tier2Sources, 1).map(fn => fn());

      const allPromises = [
        remotivePromise,
        ...greenhousePromises,
        ...leverPromises,
        ...ashbyPromises,
        ...adzunaPromises,
        ...selectedTier1,
        ...selectedTier2
      ]

      const results = await Promise.allSettled(allPromises)
      console.timeEnd(`fetchExternalSources-${profile.user_id}`)

      let allRawJobs: any[] = []

      // Extract results safely
      for (const res of results) {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          allRawJobs.push(...res.value)
        }
      }

      // Format all extracted jobs
      allRawJobs = allRawJobs.map((j: any) => {
        // Remotive doesn't output source internally in our helper, fix it here or in filter
        const source = j.source || 'remotive'; 
        return {
          source,
          external_id: String(j.external_id || j.id || Math.random().toString(36).substr(2, 9)),
          company_name: j.company_name || j.company || '',
          title: j.title || '',
          location: j.location || j.candidate_required_location || 'Worldwide',
          description: j.description || '',
          salary_text: j.salary_text || j.salary || '', 
          url: j.apply_url || j.url || '',
          raw: j.raw || j
        }
      })

      // Filter location for remotive specifically and validate salary for all
      const applicableJobs = allRawJobs.filter((job: any) => {
        if (job.source === 'remotive') {
          if (filterJobsByLocation([job.raw], userLocation).length === 0) return false;
        }
        
        const salaryText = job.salary_text || job.description; // Fallback to description text for parsing
        const salaryCheck = parseAndValidateSalary(salaryText);
        
        if (!salaryCheck.valid) return false; // Rejected due to low salary explicitly found
        
        job.salary_confirmed = salaryCheck.confirmed;
        return true;
      })
      
      if (applicableJobs.length === 0) {
         debugErrors.push(`No applicable jobs for location: ${userLocation} and role: ${userTargetRole}`)
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

        // Routing Rule: >= 80 -> Treat as auto-eligible for everyone
        let isAutoEligible = match.score >= 80
        
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
          match_details: {
            ...match,
            salary_confirmed: job.salary_confirmed,
            tailored_cv: tailoredCv,
            cover_letter: coverLetter
          },
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
