import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCVPdf } from '@/lib/services/cvGenerator'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: application, error } = await supabase
      .from('applications')
      .select('match_details')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const tailoredCv = application.match_details?.tailored_cv
    if (!tailoredCv) {
      return NextResponse.json({ error: 'Tailored CV not found for this application' }, { status: 404 })
    }

    const pdfBuffer = await generateCVPdf(tailoredCv)

    // Set headers to trigger a download
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="CV_Adaptado.pdf"`)

    return new NextResponse(pdfBuffer as any, { status: 200, headers })

  } catch (error: any) {
    console.error('Error generating PDF download:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
