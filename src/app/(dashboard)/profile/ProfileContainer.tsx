"use client"

import { useState } from "react"
import { CVUpload } from "@/components/cv/CVUpload"
import { CVEditor } from "@/components/cv/CVEditor"
import { Button } from "@/components/ui/button"
import { RefreshCw, Trash2, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function ProfileContainer({ initialProfile }: { initialProfile: any }) {
  const [profileData, setProfileData] = useState(initialProfile?.cv_data || null)
  const [isEditing, setIsEditing] = useState(!!initialProfile?.cv_data)
  const [isSaved, setIsSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleUploadComplete = (data: any) => {
    setProfileData(data)
    setIsEditing(true)
    setIsSaved(false)
  }

  const handleDelete = async () => {
    if (confirm("¿Estás seguro de que quieres eliminar tu perfil? Esto detendrá la búsqueda de empleos.")) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').delete().eq('user_id', user.id)
        setProfileData(null)
        setIsEditing(false)
      }
    }
  }

  if (isEditing && profileData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center bg-card p-4 rounded-lg border border-border gap-4">
          <div className="flex items-center gap-2">
             <CheckCircle2 className="w-5 h-5 text-green-500" />
             <span className="font-medium">Tu currículum está activo. La IA está buscando empleos para ti.</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              <RefreshCw className="w-4 h-4 mr-2" /> Actualizar PDF
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
            </Button>
          </div>
        </div>
        
        {isSaved && (
           <div className="p-4 bg-green-500/10 text-green-500 rounded-lg text-center font-medium border border-green-500/20">
             ¡Cambios guardados correctamente!
           </div>
        )}

        <CVEditor 
          initialData={profileData} 
          onSaveComplete={() => {
            setIsSaved(true)
            setTimeout(() => setIsSaved(false), 3000)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }} 
        />
      </div>
    )
  }

  return <CVUpload onUploadComplete={handleUploadComplete} />
}
