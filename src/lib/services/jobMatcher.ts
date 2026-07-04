import { GoogleGenerativeAI } from '@google/generative-ai'
import { RemotiveJob } from './jobSearch'

export interface MatchResult {
  score: number // 0 to 100
  pros: string[]
  cons: string[]
  summary: string
  cv_adaptado?: any
  carta?: string
}

export async function calculateJobMatch(cvData: any, job: RemotiveJob): Promise<MatchResult> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    // Using gemini-2.5-flash as fallback
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Limpiamos un poco la descripción HTML del trabajo para no gastar tantos tokens
    // Remotive trae la descripción en HTML, usamos un simple regex para quitar tags o mandamos raw
    const cleanDescription = job.description.replace(/<[^>]*>?/gm, '').substring(0, 5000)

    const prompt = `
      Eres un experto reclutador de Recursos Humanos y evaluador técnico.
      Compara el perfil del candidato (CV en JSON) con la vacante de empleo.

      PERFIL DEL CANDIDATO:
      ${JSON.stringify(cvData, null, 2)}

      VACANTE:
      Título: ${job.title}
      Empresa: ${job.company_name}
      Descripción: ${cleanDescription}

      TAREA:
      1. Evalúa qué tan compatible es el candidato con la vacante.
      2. Adapta el CV del candidato resaltando SOLO la experiencia relevante para esta vacante, reescribiendo o reordenando logros (SIN inventar experiencia ni habilidades que no estén en el perfil original).
      3. Escribe una carta de presentación breve (150 palabras) dirigida a la empresa.

      Debes devolver un JSON válido con la siguiente estructura estricta:
      {
        "score": 85, 
        "pros": ["Tiene experiencia en React", "Cumple con los años requeridos"],
        "cons": ["No menciona experiencia en AWS"],
        "summary": "El candidato es un excelente fit técnico pero carece de algo de infraestructura.",
        "cv_adaptado": { ... mismo esquema del CV original, optimizado ... },
        "carta": "Estimado equipo de..."
      }

      REGLAS:
      - "score" debe ser un número entero entre 0 y 100. Sé objetivo.
      - "pros" y "cons" deben ser arreglos de strings cortos (máx 3 cada uno).
      - "cv_adaptado" debe mantener la estructura original pero con textos optimizados con palabras clave de la vacante.
      - Responde SOLO con el objeto JSON, nada de texto markdown antes ni después.
    `

    const result = await model.generateContent(prompt)
    const textResponse = result.response.text()
    const jsonString = textResponse.replace(/```json\n?|\n?```/g, '').trim()
    
    return JSON.parse(jsonString) as MatchResult
  } catch (error) {
    console.error('Error calculating match for job', job.title, error)
    // Fallback genérico en caso de error de IA o parseo
    return {
      score: 0,
      pros: [],
      cons: ["Error al evaluar compatibilidad"],
      summary: "No se pudo completar el análisis."
    }
  }
}
