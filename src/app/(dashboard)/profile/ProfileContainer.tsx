"use client"

import { useState } from "react"
import { CVUpload } from "@/components/cv/CVUpload"
import { CVEditor } from "@/components/cv/CVEditor"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function ProfileContainer({ initialProfile }: { initialProfile: any }) {
  const [profileData, setProfileData] = useState(initialProfile?.cv_data || null)
  const [isEditing, setIsEditing] = useState(!!initialProfile?.cv_data)

  const handleUploadComplete = (data: any) => {
    setProfileData(data)
    setIsEditing(true)
  }

  if (isEditing && profileData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            <RefreshCw className="w-4 h-4 mr-2" /> Subir nuevo CV
          </Button>
        </div>
        <CVEditor 
          initialData={profileData} 
          onSaveComplete={() => {
            alert("Perfil guardado con éxito")
          }} 
        />
      </div>
    )
  }

  return <CVUpload onUploadComplete={handleUploadComplete} />
}
