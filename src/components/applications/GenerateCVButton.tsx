"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Loader2, FileText } from 'lucide-react'

export function GenerateCVButton({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cv/generate-tailored', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId })
      })
      
      const contentType = res.headers.get('content-type')
      if (!res.ok || !contentType?.includes('application/json')) {
        alert("El servidor tardó demasiado en responder (timeout). Intenta de nuevo en unos segundos, puede que haya menos vacantes por evaluar esta vez.")
        return
      }

      let data;
      try {
        data = await res.json()
      } catch (err) {
        alert("El servidor tardó demasiado en responder (timeout). Intenta de nuevo en unos segundos, puede que haya menos vacantes por evaluar esta vez.")
        return
      }

      router.refresh()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleGenerate} disabled={loading} size="sm">
      {loading ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando...</>
      ) : (
        <><FileText className="w-4 h-4 mr-2" /> Generar CV para este puesto</>
      )}
    </Button>
  )
}
