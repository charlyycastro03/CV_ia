import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('cv') as File

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })
    }

    // 1. Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage Error:', uploadError)
      return NextResponse.json({ error: 'Error al guardar el archivo' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('cvs')
      .getPublicUrl(fileName)

    // 2. Parse with Gemini 1.5 (Native PDF support)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const buffer = await file.arrayBuffer()
    const base64Data = Buffer.from(buffer).toString('base64')

    const prompt = `
      Analiza cuidadosamente el siguiente currículum (PDF) y extrae la información en el siguiente formato JSON estructurado.
      Asegúrate de extraer toda la experiencia laboral, educación, y habilidades relevantes.
      No inventes datos. Si falta algo, déjalo como un array vacío [] o string vacío "".

      Estructura requerida:
      {
        "name": "Nombre completo",
        "email": "Correo electrónico",
        "phone": "Número de teléfono",
        "location": "Ciudad, País",
        "experience": [
          {
            "company": "Nombre de empresa",
            "position": "Cargo",
            "startDate": "YYYY-MM",
            "endDate": "YYYY-MM o 'Presente'",
            "description": "Breve descripción de logros y tareas",
            "technologies": ["tech1", "tech2"]
          }
        ],
        "education": [
          {
            "institution": "Universidad o escuela",
            "degree": "Título obtenido",
            "startDate": "YYYY",
            "endDate": "YYYY"
          }
        ],
        "skills": ["skill1", "skill2"],
        "languages": ["idioma1", "idioma2"]
      }

      Responde SOLO con el JSON válido.
    `

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      }
    ])

    const textResponse = result.response.text()
    // Clean markdown formatting if Gemini included it
    const jsonString = textResponse.replace(/```json\n?|\n?```/g, '').trim()
    let cvData

    try {
      cvData = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Error parsing Gemini output:', textResponse)
      return NextResponse.json({ error: 'Error al procesar la respuesta de la IA' }, { status: 500 })
    }

    // 3. Save structured data to profiles table
    // Check if profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      const { error: updateError } = await supabase.from('profiles').update({
        cv_url: publicUrl,
        cv_data: cvData,
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id)
      if (updateError) throw new Error('Error al actualizar el perfil en BD: ' + updateError.message)
    } else {
      const { error: insertError } = await supabase.from('profiles').insert({
        user_id: user.id,
        cv_url: publicUrl,
        cv_data: cvData
      })
      if (insertError) throw new Error('Error al guardar el perfil en BD: ' + insertError.message)
    }

    return NextResponse.json({ success: true, data: cvData, cv_url: publicUrl })

  } catch (error: any) {
    console.error('Upload Route Error:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
