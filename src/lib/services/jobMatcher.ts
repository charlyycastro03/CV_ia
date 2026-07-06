import { GoogleGenerativeAI } from '@google/generative-ai'
import { RemotiveJob } from './jobSearch'

export interface MatchResult {
  score: number // 0 to 100
  cumple_requisitos_obligatorios: boolean
  requisitos_no_cumplidos: string[]
  pros: string[]
  cons: string[]
  summary: string
}

export interface TailoredResult {
  cv_adaptado: any
  carta: string
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
      Evalúa qué tan compatible es el candidato con la vacante.

      Debes devolver un JSON válido con la siguiente estructura estricta:
      {
        "score": 85, 
        "cumple_requisitos_obligatorios": true,
        "requisitos_no_cumplidos": [],
        "pros": ["Tiene experiencia en React", "Cumple con los años requeridos"],
        "cons": ["No menciona experiencia en AWS"],
        "summary": "El candidato es un excelente fit técnico pero carece de algo de infraestructura."
      }

      REGLAS:
      - "score" debe ser un número entero entre 0 y 100. Sé objetivo.
      - "cumple_requisitos_obligatorios" debe ser false SI Y SOLO SI el candidato no cumple con los requisitos mínimos duros y explícitos (ej. "Mínimo 5 años de exp", certificaciones necesarias).
      - "requisitos_no_cumplidos" es un arreglo con detalles de por qué es false. Si es true, debe ir vacío [].
      - "pros" y "cons" deben ser arreglos de strings cortos (máx 3 cada uno).
      - Responde SOLO con el objeto JSON, nada de texto markdown antes ni después.
    `

    // Timeout de 15 segundos para la llamada a Gemini
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => reject(new Error('Gemini timeout')))
        })
      ])
      
      clearTimeout(timeoutId)
      const textResponse = result.response.text()
      const jsonString = textResponse.replace(/```json\n?|\n?```/g, '').trim()
      
      return JSON.parse(jsonString) as MatchResult
    } catch (e: any) {
      clearTimeout(timeoutId)
      throw e;
    }
  } catch (error) {
    console.error('Error calculating match for job', job.title, error)
    // Fallback genérico en caso de error de IA o parseo
    return {
      score: 0,
      cumple_requisitos_obligatorios: false,
      requisitos_no_cumplidos: ["Error en la validación por la IA"],
      pros: [],
      cons: ["Error al evaluar compatibilidad: " + (error instanceof Error ? error.message : "Desconocido")],
      summary: "No se pudo completar el análisis."
    }
  }
}

export async function generateTailoredCVAndLetter(cvData: any, job: any): Promise<TailoredResult> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const cleanDescription = (job.description || '').replace(/<[^>]*>?/gm, '').substring(0, 5000)

    const prompt = `
      Eres un experto redactor y reclutador.
      Adapta el perfil del candidato (CV en JSON) para la vacante de empleo.

      PERFIL DEL CANDIDATO:
      ${JSON.stringify(cvData, null, 2)}

      VACANTE:
      Título: ${job.title}
      Empresa: ${job.company_name || job.company}
      Descripción: ${cleanDescription}

      TAREA:
      1. Adapta el CV del candidato resaltando SOLO la experiencia relevante para esta vacante, reescribiendo o reordenando logros (SIN inventar experiencia ni habilidades que no estén en el perfil original).
      2. Escribe una carta de presentación breve (150 palabras) dirigida a la empresa.

      Debes devolver un JSON válido con la siguiente estructura estricta:
      {
        "cv_adaptado": { ... mismo esquema del CV original, optimizado ... },
        "carta": "Estimado equipo de..."
      }

      REGLAS:
      - "cv_adaptado" debe mantener la estructura original pero con textos optimizados con palabras clave de la vacante.
      - Responde SOLO con el objeto JSON, nada de texto markdown antes ni después.
    `

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s for heavy generation

    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => reject(new Error('Gemini timeout in generation')))
        })
      ])
      
      clearTimeout(timeoutId)
      const textResponse = result.response.text()
      const jsonString = textResponse.replace(/```json\n?|\n?```/g, '').trim()
      
      return JSON.parse(jsonString) as TailoredResult
    } catch (e: any) {
      clearTimeout(timeoutId)
      throw e;
    }
  } catch (error) {
    console.error('Error tailoring CV for job', job.title, error)
    return {
      cv_adaptado: cvData, // fallback to original
      carta: ''
    }
  }
}

