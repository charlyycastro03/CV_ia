"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CVUpload } from '@/components/cv/CVUpload'
import { CVPreview } from '@/components/cv/CVPreview'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CVUploadPage() {
  const router = useRouter()
  const [cvData, setCvData] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('cv_data')
            .eq('user_id', user.id)
            .maybeSingle()
          
          if (profile?.cv_data) {
            setCvData(profile.cv_data)
            setShowPreview(true)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleUploadComplete = (data: any) => {
    setCvData(data)
    setShowPreview(true)
  }

  const handleContinue = () => {
    router.push('/dashboard')
  }

  const handleDelete = () => {
    setCvData(null)
    setShowPreview(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al dashboard
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {showPreview ? 'Tu Currículum' : 'Sube tu Currículum'}
            </h1>
            <p className="text-muted-foreground">
              {showPreview 
                ? 'Revisa y edita tu información para mejorar tus posibilidades'
                : 'Nuestra IA analizará tu CV y extraerá tu información automáticamente'
              }
            </p>
          </div>

          {!showPreview ? (
            <CVUpload onUploadComplete={handleUploadComplete} />
          ) : (
            <div className="space-y-6">
              {/* Optional success banner can be shown here if needed */}
              <CVPreview cvData={cvData} onSave={setCvData} onDelete={handleDelete} />

              <div className="flex gap-4 pb-24">
                <Button 
                  onClick={handleContinue}
                  className="flex-1"
                  size="lg"
                >
                  Ir al Dashboard
                </Button>
              </div>
            </div>
          )}
        </FadeIn>
      </div>
    </div>
  )
}
