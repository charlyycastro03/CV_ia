import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchRemoteJobs, filterJobsByLocation } from '@/lib/services/jobSearch'
import { fetchGreenhouseJobs } from '@/lib/sources/greenhouse'
import { fetchLeverJobs } from '@/lib/sources/lever'
import { fetchAdzunaJobs } from '@/lib/sources/adzuna'
import { fetchRemoteOKJobs } from '@/lib/sources/remoteok'
import { fetchArbeitnowJobs } from '@/lib/sources/arbeitnow'
import { fetchHimalayasJobs } from '@/lib/sources/himalayas'
import { fetchJobicyJobs } from '@/lib/sources/jobicy'

import { ADZUNA_TARGET_COUNTRIES } from '@/lib/constants/targetRegions'
import { GREENHOUSE_BOARDS, LEVER_BOARDS } from '@/lib/constants/targetCompanies'
import { calculateJobMatch } from '@/lib/services/jobMatcher'

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const isManual = !!userId

  // Auth check for cron
  if (!isManual) {
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // CRITICAL: Create supabase client INSIDE the request handler
  // to ensure env vars are fully loaded (not at module init time)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseServiceKey) {
    console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY missing — inserts will fail RLS')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

  try {
    let totalEvaluated = 0
    let totalSaved = 0
    let jobsAlreadyEvaluated = 0
    let debugErrors: string[] = []

    // Higher limits now that we removed the slow generateCV step
    const MAX_PROFILES_PER_RUN = isManual ? 1 : 2;
    const MAX_EVALUATIONS_PER_RUN = isManual ? 20 : 15;

    // 1. Fetch profiles with CV data
    let profilesQuery = supabase
      .from('profiles')
      .select('user_id, cv_data, last_matched_at')
      .not('cv_data', 'is', null)

    if (isManual) {
      profilesQuery = profilesQuery.eq('user_id', userId)
    } else {
      profilesQuery = profilesQuery
        .order('last_matched_at', { ascending: true, nullsFirst: true })
        .limit(MAX_PROFILES_PER_RUN)
    }

    const { data: profiles, error: profileErr } = await profilesQuery

    if (profileErr) {
      debugErrors.push('Error fetching profiles: ' + profileErr.message)
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No profiles to process', errors: debugErrors })
    }

    let profilesProcessed: string[] = []

    for (const profile of profiles) {
      if (totalEvaluated >= MAX_EVALUATIONS_PER_RUN) break;

      const userLocation = profile.cv_data?.location || 'worldwide'
      const userTargetRole = profile.cv_data?.target_role
        || profile.cv_data?.title
        || profile.cv_data?.basics?.label
        || 'software developer'

      debugErrors.push(`Processing profile ${profile.user_id}, role: ${userTargetRole}`)

      // 2. Fetch jobs — use a FAST subset to avoid 60s timeout
      const getSubset = <T>(arr: T[], n: number) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

      const greenhouseBoards = isManual ? 4 : 2;
      const leverBoards = isManual ? 2 : 1;

      const allPromises = [
        fetchRemoteJobs(15, userTargetRole),          // Remotive
        fetchArbeitnowJobs(),                          // Arbeitnow — fast, no auth
        fetchHimalayasJobs(),                          // Himalayas — fast, no auth
        fetchJobicyJobs(),                             // Jobicy — fast, no auth
        fetchRemoteOKJobs(userTargetRole),             // RemoteOK — fast, no auth
        ...getSubset(GREENHOUSE_BOARDS, greenhouseBoards).map(b => fetchGreenhouseJobs(b)),
        ...getSubset(LEVER_BOARDS, leverBoards).map(b => fetchLeverJobs(b)),
        ...getSubset(ADZUNA_TARGET_COUNTRIES, 1).map(c =>
          fetchAdzunaJobs(`${userTargetRole} remote`, c.code, c.salaryMin)
        ),
      ]

      const results = await Promise.allSettled(allPromises)

      let allRawJobs: any[] = []
      for (const res of results) {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          allRawJobs.push(...res.value)
        } else if (res.status === 'rejected') {
          debugErrors.push('Source failed: ' + String(res.reason).substring(0, 100))
        }
      }

      debugErrors.push(`Total raw jobs fetched: ${allRawJobs.length}`)

      // 3. Normalize
      const normalizedJobs = allRawJobs.map((j: any) => ({
        source: j.source || 'remotive',
        external_id: String(j.external_id || j.id || Math.random().toString(36).substr(2, 9)),
        company_name: j.company_name || j.company || '',
        title: j.title || '',
        location: j.location || j.candidate_required_location || 'Worldwide',
        description: j.description || '',
        salary_text: j.salary_text || j.salary || '',
        url: j.apply_url || j.url || '',
        raw: j.raw || j
      }))

      // 4. Filter — ONLY location filter for Remotive, NO salary filter (too aggressive)
      const applicableJobs = normalizedJobs.filter((job: any) => {
        if (job.source === 'remotive') {
          return filterJobsByLocation([job.raw], userLocation).length > 0
        }
        return true // All other sources: don't filter by salary/location
      })

      debugErrors.push(`Jobs after filter: ${applicableJobs.length}`)

      if (applicableJobs.length === 0) {
        debugErrors.push(`No applicable jobs for ${userTargetRole}`)
        profilesProcessed.push(profile.user_id)
        continue;
      }

      // 5. Process jobs in parallel batches to avoid Vercel 60s timeout
      const processInBatches = async <T>(items: T[], batchSize: number, handler: (item: T) => Promise<void>) => {
        const results = [];
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          const batchResults = await Promise.allSettled(batch.map(handler));
          results.push(...batchResults);
        }
        return results;
      };

      const jobHandler = async (job: any) => {
        if (totalEvaluated >= MAX_EVALUATIONS_PER_RUN) return;

        // Upsert job to DB
        const { data: upsertedJob, error: upsertErr } = await supabase
          .from('jobs')
          .upsert(
            {
              title: job.title,
              company_name: job.company_name,
              location: job.location,
              description: (job.description || '').substring(0, 5000), // Limit description size
              external_id: job.external_id,
              url: job.url,
              source: job.source
            },
            { onConflict: 'source,external_id', ignoreDuplicates: false }
          )
          .select('id')
          .single()

        if (upsertErr) {
          debugErrors.push(`Upsert error [${job.source}:${job.external_id}]: ${upsertErr.message} (code: ${upsertErr.code})`)
          return
        }

        const dbJobId = upsertedJob?.id
        if (!dbJobId) {
          debugErrors.push(`No dbJobId for [${job.source}:${job.external_id}] — RLS?`)
          return
        }

        // Check if already evaluated
        const { data: existingApp } = await supabase
          .from('applications')
          .select('id')
          .eq('user_id', profile.user_id)
          .eq('job_id', dbJobId)
          .maybeSingle()

        if (existingApp) {
          jobsAlreadyEvaluated++;
          return;
        }

        // Ensure we don't exceed limit if multiple concurrent requests hit this
        if (totalEvaluated >= MAX_EVALUATIONS_PER_RUN) return;

        // Evaluate match with AI (using 10s timeout here)
        totalEvaluated++
        const match = await calculateJobMatch(profile.cv_data, job as any, 10000)
        if (!match) {
          debugErrors.push(`calculateJobMatch returned null for ${job.title}`)
          return;
        }

        // Insert application
        const { data: appData, error: insertAppErr } = await supabase
          .from('applications')
          .insert({
            user_id: profile.user_id,
            job_id: dbJobId,
            status: 'pending_review',
            application_method: 'assisted',
            match_score: match.score,
            match_details: { ...match, salary_confirmed: !!job.salary_text },
            applied_at: new Date().toISOString()
          })
          .select('id')
          .maybeSingle()

        if (insertAppErr) {
          debugErrors.push(`Insert app error: ${insertAppErr.message} (code: ${insertAppErr.code})`)
        } else if (appData) {
          totalSaved++
        }
      };

      const batchResults = await processInBatches(applicableJobs, 5, jobHandler);
      for (const res of batchResults) {
        if (res.status === 'rejected') {
          debugErrors.push('Batch error: ' + String(res.reason).substring(0, 100))
        }
      }

      profilesProcessed.push(profile.user_id)
    }

    // Update last_matched_at
    if (profilesProcessed.length > 0) {
      await supabase
        .from('profiles')
        .update({ last_matched_at: new Date().toISOString() })
        .in('user_id', profilesProcessed)
    }

    return NextResponse.json({
      success: true,
      mode: isManual ? 'manual' : 'cron',
      totalEvaluated,
      totalSaved,
      jobsAlreadyEvaluated,
      profilesProcessed: profilesProcessed.length,
      errors: debugErrors
    })

  } catch (error: any) {
    console.error('Cron Error:', error)
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}
