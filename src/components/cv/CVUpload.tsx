"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, FileText, CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/animations/FadeIn'

interface CVUploadProps {
  onUploadComplete: (data: any) => void
}

export function CVUpload({ onUploadComplete }: CVUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('cv', file)

    try {
      const res = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Error al procesar el currículum')
      }

      onUploadComplete(result.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }, [onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false,
    disabled: isUploading
  })

  return (
    <FadeIn>
      <Card className="w-full max-w-2xl mx-auto border-dashed border-2">
        <CardHeader className="text-center">
          <CardTitle>Sube tu Currículum</CardTitle>
          <CardDescription>
            Sube tu PDF y nuestra IA extraerá tu información automáticamente para ayudarte a encontrar y aplicar a los mejores empleos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              flex flex-col items-center justify-center p-12 rounded-lg cursor-pointer transition-colors
              ${isDragActive ? 'bg-primary/5 border-primary' : 'bg-muted/30 hover:bg-muted'}
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {isUploading ? (
              <div className="flex flex-col items-center space-y-4 text-primary">
                <Loader2 className="w-12 h-12 animate-spin" />
                <p className="font-medium text-lg">Analizando con Inteligencia Artificial...</p>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Estamos leyendo tu experiencia y habilidades para crear tu perfil estructurado. Esto tomará unos segundos.
                </p>
              </div>
            ) : isDragActive ? (
              <div className="flex flex-col items-center space-y-4 text-primary">
                <UploadCloud className="w-12 h-12" />
                <p className="font-medium">¡Suéltalo aquí!</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4 text-muted-foreground">
                <div className="p-4 bg-background rounded-full shadow-sm">
                  <FileText className="w-10 h-10 text-primary/70" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Arrastra tu PDF aquí o haz clic para seleccionar</p>
                  <p className="text-sm mt-1">Solo archivos PDF (Máx. 5MB)</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 text-sm font-medium text-destructive-foreground bg-destructive/10 rounded-md text-center">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  )
}
