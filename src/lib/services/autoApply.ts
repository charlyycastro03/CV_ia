import { Resend } from 'resend'
import { generateCVPdf } from './cvGenerator'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build')

export async function sendAutoApplication(
  job: any, 
  profile: any, 
  tailoredCv: any,
  coverLetter: string
) {
  try {
    // 1. Generar el PDF
    const pdfBuffer = await generateCVPdf(tailoredCv)

    // 2. Determinar el destinatario
    // En un escenario real, buscaríamos un email en job.raw o job.description.
    // Para propósitos de este sistema, usaremos una dirección de prueba o el email configurado.
    // O si es una API como Greenhouse/Lever, haríamos el POST aquí.
    const recruiterEmail = extractEmailFromJob(job)
    
    if (!recruiterEmail) {
      throw new Error("AUTO_APPLY_NO_EMAIL: Job does not contain an email address (likely uses ATS form). Falling back to ready_to_apply.")
    }

    // 3. Enviar correo vía Resend
    const { data, error } = await resend.emails.send({
      from: 'CV_ia Auto-Apply <applications@cvia.com>', // Configurar dominio validado en Resend
      to: [recruiterEmail],
      subject: `Application for ${job.title} - ${profile.name || 'Candidate'}`,
      text: coverLetter,
      attachments: [
        {
          filename: `${profile.name ? profile.name.replace(/\s+/g, '_') : 'Candidate'}_CV.pdf`,
          content: pdfBuffer,
        }
      ]
    })

    if (error) {
      throw new Error(`Resend error: ${error.message}`)
    }

    return { success: true, messageId: data?.id }
  } catch (error: any) {
    console.error("AutoApply Error:", error)
    return { success: false, error: error.message }
  }
}

function extractEmailFromJob(job: any): string | null {
  // Mock logic to extract email
  // You would write regex to find emails in job.description or use API structured data
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const match = job.description?.match(emailRegex);
  
  if (match && match.length > 0) {
    // Filter out common dummy emails or return the first real looking one
    return match[0];
  }
  
  // Si estamos probando, retorna un email tuyo para ver cómo llega.
  // En producción, solo retornar si hay un match.
  if (process.env.NODE_ENV === 'development') {
    return 'test@example.com' // Cambia esto por tu email para probar localmente
  }
  
  return null;
}
