"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SyncJobsButton() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resultMsg, setResultMsg] = useState('')
  const router = useRouter()

  const handleSync = async () => {
    setLoading(true)
    setSuccess(false)
    setResultMsg('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const url = user ? `/api/cron/jobs-sync?userId=${user.id}` : '/api/cron/jobs-sync'

      const res = await fetch(url, { method: 'GET' })
      
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

      console.log('🔍 Cron result:', JSON.stringify(data, null, 2))

      if (data.message === 'No profiles to process') {
        alert("⚠️ No tienes un CV subido con datos válidos. Ve a 'Mi CV' y sube tu currículum primero.")
        return
      }

      if (data.errors && data.errors.length > 0) {
        console.warn('Cron warnings:', data.errors)
      }

      const saved = data.totalSaved ?? 0
      const evaluated = data.totalEvaluated ?? 0

      if (saved === 0 && data.jobsAlreadyEvaluated > 0) {
        alert("Ya evaluamos todas las vacantes disponibles en esta corrida, vuelve a intentar más tarde para nuevas fuentes.")
        return
      }

      if (saved === 0 && evaluated === 0) {
        alert(`⚠️ La búsqueda terminó pero no se procesó ninguna vacante. Abre la consola (F12 > Console) para ver el detalle.\n\n${(data.errors || []).slice(0, 5).join('\n')}`)
        return
      }

      setSuccess(true)
      setResultMsg(saved > 0 ? `✓ ${saved} nuevas vacantes agregadas (revisa más abajo en la lista, están ordenadas por compatibilidad)` : `✓ ${evaluated} analizadas`)
      router.refresh()

      setTimeout(() => { setSuccess(false); setResultMsg('') }, 5000)
    } catch (error) {
      console.error(error)
      alert("Error de red al conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
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
      {resultMsg && (
        <span className="text-xs text-green-400 font-mono">{resultMsg}</span>
      )}
    </div>
  )
}
