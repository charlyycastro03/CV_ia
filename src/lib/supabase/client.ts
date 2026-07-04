import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log("DEBUG ENV:", { 
    urlExists: !!url, 
    urlValue: url,
    keyExists: !!key 
  })

  if (!url || !key) {
    console.error("🚨 ALERTA CRÍTICA: Faltan variables de entorno de Supabase en Vercel. Asegúrate de llamarlas exactamente NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

  return createBrowserClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  )
}
