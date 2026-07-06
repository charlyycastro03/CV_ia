import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchRemoteJobs } from '@/lib/services/jobSearch'
import { fetchArbeitnowJobs } from '@/lib/sources/arbeitnow'
import { fetchHimalayasJobs } from '@/lib/sources/himalayas'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const results: any = {
    steps: [],
    jobs_fetched: 0,
    jobs_after_filter: 0,
    jobs_upserted: 0,
    profile_found: false,
    errors: [],
  }

  try {
    // Step 1: Check env vars
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const geminiKey = process.env.GEMINI_API_KEY

    results.steps.push({
      step: '1_env_check',
      url_exists: !!url,
      service_key_exists: !!serviceKey,
      service_key_length: serviceKey?.length,
      anon_key_exists: !!anonKey,
      gemini_key_exists: !!geminiKey,
    })

    if (!url || (!serviceKey && !anonKey)) {
      results.errors.push('Missing critical env vars')
      return NextResponse.json(results)
    }

    // Step 2: Create fresh client (inside request, not module-level)
    const supabase = createClient(url, serviceKey || anonKey!)
    results.steps.push({ step: '2_supabase_client', using_service_key: !!serviceKey })

    // Step 3: Check profiles
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('user_id, cv_data, last_matched_at')
      .not('cv_data', 'is', null)
      .limit(1)

    if (profileErr) {
      results.errors.push('Profile error: ' + profileErr.message)
      results.steps.push({ step: '3_profiles', error: profileErr.message })
    } else {
      results.profile_found = (profiles?.length || 0) > 0
      results.steps.push({
        step: '3_profiles',
        count: profiles?.length,
        first_user_id: profiles?.[0]?.user_id,
        has_cv_data: !!profiles?.[0]?.cv_data,
        cv_data_keys: profiles?.[0]?.cv_data ? Object.keys(profiles[0].cv_data) : [],
        target_role: profiles?.[0]?.cv_data?.target_role,
      })
    }

    // Step 4: Try fetching jobs from 2 sources
    const [remotiveRes, arbeitnowRes] = await Promise.allSettled([
      fetchRemoteJobs(5, profiles?.[0]?.cv_data?.target_role || 'developer'),
      fetchArbeitnowJobs(),
    ])

    const remotiveJobs = remotiveRes.status === 'fulfilled' ? remotiveRes.value : []
    const arbeitnowJobs = arbeitnowRes.status === 'fulfilled' ? arbeitnowRes.value : []

    results.steps.push({
      step: '4_fetch_jobs',
      remotive_count: remotiveJobs.length,
      remotive_error: remotiveRes.status === 'rejected' ? String(remotiveRes.reason) : null,
      arbeitnow_count: arbeitnowJobs.length,
      arbeitnow_error: arbeitnowRes.status === 'rejected' ? String(arbeitnowRes.reason) : null,
    })

    const allJobs = [...remotiveJobs, ...arbeitnowJobs]
    results.jobs_fetched = allJobs.length

    // Step 5: Try upserting 1 job directly
    if (allJobs.length > 0) {
      const testJob = allJobs[0] as any
      const { data: upsertResult, error: upsertErr } = await supabase
        .from('jobs')
        .upsert({
          title: testJob.title || 'Test Job',
          company_name: testJob.company_name || testJob.company || 'Test Co',
          location: testJob.candidate_required_location || testJob.location || 'Worldwide',
          description: (testJob.description || '').substring(0, 500),
          external_id: String(testJob.id || testJob.external_id || 'test-123'),
          url: testJob.url || testJob.apply_url || '',
          source: testJob.source || 'remotive',
        }, { onConflict: 'source,external_id', ignoreDuplicates: false })
        .select('id')
        .single()

      results.steps.push({
        step: '5_upsert_job',
        job_title: testJob.title,
        success: !upsertErr,
        db_id: upsertResult?.id,
        error: upsertErr?.message,
        error_code: upsertErr?.code,
      })

      if (upsertResult?.id) results.jobs_upserted = 1
    }

    // Step 6: Check jobs count in DB
    const { count: jobsCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    const { count: appsCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })

    results.steps.push({
      step: '6_db_counts',
      total_jobs_in_db: jobsCount,
      total_applications_in_db: appsCount,
    })

    return NextResponse.json(results)

  } catch (err: any) {
    results.errors.push('Fatal: ' + err.message)
    return NextResponse.json(results, { status: 500 })
  }
}
