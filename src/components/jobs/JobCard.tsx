"use client"

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, CheckCircle, ChevronDown, ChevronUp, MapPin, Building, Briefcase, BookmarkPlus, Loader2 } from 'lucide-react'
import { SlideIn } from '@/components/animations/SlideIn'
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

  // Score color logic
  const score = application.match_score
  let scoreColor = 'text-red-500'
  if (score >= 90) scoreColor = 'text-green-500'
  else if (score >= 70) scoreColor = 'text-yellow-500'
  else if (score >= 50) scoreColor = 'text-orange-500'

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('applications')
      .update({ status: 'ready_to_apply' })
      .eq('id', application.id)
    
    if (!error) {
      router.refresh()
    } else {
      setSaving(false)
    }
  }

  return (
    <SlideIn delay={delay}>
      <Card className={`overflow-hidden transition-all duration-200 border-2 ${isAutoApplied ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/20'}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold">{job.title}</CardTitle>
              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center"><Building className="w-4 h-4 mr-1"/> {job.company_name}</span>
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1"/> {job.location}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className={`text-3xl font-black ${scoreColor}`}>
                {score}%
              </div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Match Score</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isAutoApplied && (
            <div className="mb-4 inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
              <CheckCircle className="w-4 h-4 mr-2" />
              Alta compatibilidad — lista para aplicar
            </div>
          )}
          
          <p className="text-sm text-foreground/80 line-clamp-2">
            {matchDetails.summary}
          </p>

          {expanded && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookmarkPlus className="w-4 h-4 mr-2" />}
                Guardar
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
