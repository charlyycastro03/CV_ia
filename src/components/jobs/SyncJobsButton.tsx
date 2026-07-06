"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function SyncJobsButton() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setLoading(true)
    setSuccess(false)
    try {
      const res = await fetch('/api/cron/jobs-sync', { method: 'GET' })
      if (!res.ok) throw new Error('Error al sincronizar')
      
      const data = await res.json()
      setSuccess(true)
      router.refresh()
      
      // Hide success state after 3s
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error(error)
      alert("Hubo un problema al buscar ofertas. Por favor intenta más tarde.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleSync} 
      disabled={loading}
      className={`min-w-[200px] relative overflow-hidden transition-all active:scale-[0.97] ${success ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
    >
      {loading && (
        <div className="absolute inset-x-0 h-1 bg-primary blur-[2px] animate-scan z-10" />
      )}
      {loading ? (
        <>
          <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
          Escaneando...
        </>
      ) : success ? (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          ¡Búsqueda Completada!
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          Buscar Nuevas Ofertas
        </>
      )}
    </Button>
  )
}
