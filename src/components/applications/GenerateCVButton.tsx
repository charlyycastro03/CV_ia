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
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error generando CV')
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
