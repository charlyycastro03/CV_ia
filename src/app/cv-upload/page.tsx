"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CVUpload } from '@/components/cv/CVUpload'
import { CVPreview } from '@/components/cv/CVPreview'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'
import Link from 'next/link'

export default function CVUploadPage() {
  const router = useRouter()
  const [cvData, setCvData] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleUploadComplete = (data: any) => {
    setCvData(data)
    setShowPreview(true)
  }

  const handleContinue = () => {
    router.push('/')
  }

  const handleReset = () => {
    setCvData(null)
    setShowPreview(false)
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <Link 
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al dashboard
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {showPreview ? 'Revisa tu CV' : 'Sube tu Currículum'}
            </h1>
            <p className="text-muted-foreground">
              {showPreview 
                ? 'Verifica que la información extraída sea correcta'
                : 'Nuestra IA analizará tu CV y extraerá tu información automáticamente'
              }
            </p>
          </div>

          {!showPreview ? (
            <CVUpload onUploadComplete={handleUploadComplete} />
          ) : (
            <div className="space-y-6">
              <Card className="border-green-500/50 bg-green-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-semibold">CV cargado exitosamente</p>
                      <p className="text-sm text-muted-foreground">
                        La información ha sido extraída y está lista para revisar
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <CVPreview cvData={cvData} />

              <div className="flex gap-4 pb-24">
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="flex-1"
                >
                  Cargar otro CV
                </Button>
                <Button 
                  onClick={handleContinue}
                  className="flex-1"
                >
                  Continuar al Dashboard
                </Button>
              </div>
            </div>
          )}
        </FadeIn>
      </div>
    </div>
  )
}
