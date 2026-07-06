"use client"

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, CheckCircle, ChevronDown, ChevronUp, MapPin, Building, Briefcase, BookmarkPlus, Loader2, AlertCircle, BadgeDollarSign } from 'lucide-react'
import { SlideIn } from '@/components/animations/SlideIn'
import { ScoreGauge } from '@/components/ui/score-gauge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface JobCardProps {
  application: any
  delay?: number
}

export function JobCard({ application, delay = 0 }: JobCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  
  const job = application.jobs
  const matchDetails = application.match_details || { pros: [], cons: [], summary: '' }
  const isAutoApplied = application.status === 'ready_to_apply'

  // Score style logic for hover
  const score = application.match_score
  let hoverStyle = 'hover:border-signal-low/50 hover:shadow-[0_0_15px_hsl(var(--signal-low)/0.15)] hover:-translate-y-[2px]'
  if (score >= 80) hoverStyle = 'hover:border-signal-high/50 hover:shadow-[0_0_15px_hsl(var(--signal-high)/0.15)] hover:-translate-y-[2px]'
  else if (score >= 50) hoverStyle = 'hover:border-signal-mid/50 hover:shadow-[0_0_15px_hsl(var(--signal-mid)/0.15)] hover:-translate-y-[2px]'

  const handleSave = async () => {
    setSaving(true)
    try {
      if (!matchDetails.tailored_cv) {
        // Necesitamos generar el CV antes de guardarlo en Mis Aplicaciones
        const res = await fetch('/api/cv/generate-tailored', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId: application.id })
        })
        if (!res.ok) throw new Error('Failed to generate CV')
      } else {
        // Si ya tiene CV, solo actualizamos el estado
        const supabase = createClient()
        const { error } = await supabase
          .from('applications')
          .update({ status: 'ready_to_apply' })
          .eq('id', application.id)
        if (error) throw error
      }
      router.refresh()
    } catch (e) {
      console.error(e)
      alert("Hubo un error al guardar y generar tu CV. Intenta de nuevo.")
      setSaving(false)
    }
  }

  return (
    <SlideIn delay={delay}>
      <Card className={`overflow-hidden transition-all duration-200 border-2 ${isAutoApplied ? 'border-primary/50 bg-primary/5' : 'border-border'} ${hoverStyle}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold">{job.title}</CardTitle>
              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center"><Building className="w-4 h-4 mr-1"/> {job.company_name}</span>
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1"/> {job.location}</span>
              </div>
            </div>
            <div className="flex flex-col items-end justify-center">
              <ScoreGauge value={score} size={64} delay={delay} />
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-1">Match Score</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {isAutoApplied && (
              <div className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                <CheckCircle className="w-4 h-4 mr-2" />
                Alta compatibilidad — lista para aplicar
              </div>
            )}
            
            {matchDetails.cumple_requisitos_obligatorios && score >= 90 && !isAutoApplied && (
              <div className="inline-flex items-center bg-signal-high/20 text-signal-high px-3 py-1 rounded-full text-sm font-semibold">
                <CheckCircle className="w-4 h-4 mr-2" />
                Alta compatibilidad: Cumples todos los requisitos
              </div>
            )}

            {matchDetails.salary_confirmed === false && (
              <div className="inline-flex items-center bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-semibold">
                <BadgeDollarSign className="w-4 h-4 mr-2" />
                Salario no especificado
              </div>
            )}
          </div>
          
          <p className="text-sm text-foreground/80 line-clamp-2">
            {matchDetails.summary}
          </p>

          {expanded && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchDetails.cumple_requisitos_obligatorios === false && matchDetails.requisitos_no_cumplidos?.length > 0 && (
                  <div className="col-span-1 md:col-span-2 bg-destructive/10 rounded-lg p-4 border border-destructive/20">
                    <h4 className="font-semibold text-destructive mb-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" /> Requisitos Obligatorios No Cumplidos
                    </h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-destructive/90">
                      {matchDetails.requisitos_no_cumplidos.map((req: string, i: number) => <li key={i}>{req}</li>)}
                    </ul>
                  </div>
                )}
                
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Puntos Fuertes (Pros)</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 text-green-900 dark:text-green-200">
                    {matchDetails.pros?.map((pro: string, i: number) => <li key={i}>{pro}</li>)}
                  </ul>
                </div>
                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                  <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">Áreas de Mejora (Cons)</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 text-red-900 dark:text-red-200">
                    {matchDetails.cons?.map((con: string, i: number) => <li key={i}>{con}</li>)}
                  </ul>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <h4 className="font-semibold mb-2">Descripción del Puesto</h4>
                {/* As Remotive HTML is stripped, we just show raw text here */}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {job.description.substring(0, 800)}...
                </p>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t border-border bg-muted/20 pt-4">
          <Button variant="ghost" onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
            {expanded ? (
              <><ChevronUp className="w-4 h-4 mr-2" /> Ocultar Análisis</>
            ) : (
              <><ChevronDown className="w-4 h-4 mr-2" /> Ver Análisis de IA</>
            )}
          </Button>
          <div className="flex gap-2">
            {!isAutoApplied && application.status === 'pending_review' && (
              <Button variant="outline" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando CV...</>
                ) : (
                  <><BookmarkPlus className="w-4 h-4 mr-2" /> Generar CV para este puesto</>
                )}
              </Button>
            )}
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              <Button variant={isAutoApplied ? "outline" : "default"}>
                Ver Oferta Original <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </CardFooter>
      </Card>
    </SlideIn>
  )
}
