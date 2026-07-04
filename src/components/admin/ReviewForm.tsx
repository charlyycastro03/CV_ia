"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CVEditor } from '@/components/cv/CVEditor'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function ReviewForm({ application }: { application: any }) {
  const [coverLetter, setCoverLetter] = useState(application.match_details?.carta || '')
  const router = useRouter()
  const supabase = createClient()

  const handleSaveAndSend = async (cvData: any) => {
    // Aquí es donde el equipo aprueba el envío.
    // 1. Guardar los cambios en el JSON (cv_adaptado) y la carta
    const updatedDetails = {
      ...application.match_details,
      cv_adaptado: cvData,
      carta: coverLetter
    }

    const { error } = await supabase.from('applications').update({
      match_details: updatedDetails,
      status: 'submitted_by_team' // Cambiar el estatus
    }).eq('id', application.id)

    if (error) {
      alert("Error al actualizar la aplicación: " + error.message)
      return
    }

    // Insertar el log de que se mandó
    await supabase.from('application_logs').insert({
      application_id: application.id,
      status: 'submitted_by_team',
      notes: 'CV adaptado y enviado por un revisor humano.'
    })

    alert("¡Aplicación enviada con éxito!")
    router.push('/admin/review')
  }

  const handleRequestInfo = async () => {
    const { error } = await supabase.from('applications').update({
      status: 'needs_candidate_info'
    }).eq('id', application.id)

    if (error) {
      alert("Error: " + error.message)
      return
    }
    
    await supabase.from('application_logs').insert({
      application_id: application.id,
      status: 'needs_candidate_info',
      notes: 'El equipo requiere más información para proceder.'
    })

    router.push('/admin/review')
  }

  const initialCvData = application.match_details?.cv_adaptado || application.profiles?.cv_data || {}

  return (
    <div className="space-y-8">
      <div className="bg-card p-6 border rounded-lg shadow-sm">
        <h3 className="text-xl font-bold mb-4">Revisar y Enviar a: {application.jobs.company_name}</h3>
        <p className="mb-4">Vacante: <strong>{application.jobs.title}</strong> (Score: {application.match_score}%)</p>
        
        <div className="space-y-2 mb-6">
          <Label>Carta de Presentación (Borrador de Gemini)</Label>
          <Textarea 
            value={coverLetter} 
            onChange={(e) => setCoverLetter(e.target.value)}
            className="h-40"
          />
        </div>
        
        <div className="flex space-x-4">
          <Button variant="outline" onClick={handleRequestInfo} className="w-full text-destructive border-destructive hover:bg-destructive/10">
            Solicitar Info al Candidato
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2 text-muted-foreground px-2">Editor de CV Adaptado</h3>
        {/* Usamos el editor genérico pero inyectando la info pre-procesada */}
        <CVEditor 
          initialData={initialCvData} 
          onSave={handleSaveAndSend}
          buttonText="Aprobar y Enviar (Marcar Terminado)"
        />
      </div>
    </div>
  )
}
