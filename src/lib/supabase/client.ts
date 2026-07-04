import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Clean aggressively to remove any accidental quotes, single quotes or spaces
  const cleanUrl = (url || '').replace(/['"]/g, '').trim()
  const cleanKey = (key || '').replace(/['"]/g, '').trim()

  console.log("DEBUG ENV:", { 
    urlExists: !!url, 
    cleanUrlValue: cleanUrl,
    keyExists: !!key 
  })

  if (!cleanUrl || !cleanKey) {
    console.error("🚨 ALERTA CRÍTICA: Faltan variables de entorno de Supabase en Vercel.")
  }

  return createBrowserClient(cleanUrl, cleanKey)
}
