"use client"

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Plus, Trash2, Save, User as UserIcon, Briefcase, GraduationCap, Code } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SlideIn } from '@/components/animations/SlideIn'

interface CVEditorProps {
  initialData: any
  onSaveComplete?: () => void
}

export function CVEditor({ initialData, onSaveComplete }: CVEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()
  
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      name: '', email: '', phone: '', location: '',
      experience: [], education: [], skills: []
    }
  })

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control,
    name: "experience"
  })

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control,
    name: "education"
  })

  const onSubmit = async (data: any) => {
    setIsSaving(true)
    
    // El skills podría venir como string separado por comas si lo editaron manual
    if (typeof data.skills === 'string') {
      data.skills = data.skills.split(',').map((s: string) => s.trim())
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({
        cv_data: data,
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id)
    }
    
    setIsSaving(false)
    if (onSaveComplete) onSaveComplete()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto pb-24">
      <SlideIn delay={0.1}>
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <UserIcon className="w-5 h-5 text-primary" />
              <CardTitle>Información Personal</CardTitle>
            </div>
            <CardDescription>Tus datos básicos de contacto.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input {...register("name")} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...register("email")} type="email" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input {...register("location")} />
            </div>
          </CardContent>
        </Card>
      </SlideIn>

      <SlideIn delay={0.2}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <CardTitle>Experiencia Laboral</CardTitle>
              </div>
              <CardDescription>Revisa y ajusta tu trayectoria profesional.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => appendExp({ company: '', position: '', startDate: '', endDate: '', description: '' })}>
              <Plus className="w-4 h-4 mr-2" /> Agregar
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {expFields.map((field, index) => (
              <div key={field.id} className="p-4 border border-border rounded-lg relative bg-muted/20">
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => removeExp(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
                  <div className="space-y-2">
                    <Label>Cargo / Puesto</Label>
                    <Input {...register(`experience.${index}.position` as const)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa</Label>
                    <Input {...register(`experience.${index}.company` as const)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Inicio</Label>
                    <Input {...register(`experience.${index}.startDate` as const)} placeholder="Ej: 2020-01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Fin</Label>
                    <Input {...register(`experience.${index}.endDate` as const)} placeholder="Ej: 2023-12 o Presente" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descripción de logros y tareas</Label>
                  <textarea 
                    {...register(`experience.${index}.description` as const)} 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            ))}
            {expFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No se detectó experiencia laboral.</p>}
          </CardContent>
        </Card>
      </SlideIn>

      <SlideIn delay={0.3}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <CardTitle>Educación</CardTitle>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => appendEdu({ institution: '', degree: '', startDate: '', endDate: '' })}>
              <Plus className="w-4 h-4 mr-2" /> Agregar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {eduFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-border rounded-lg relative bg-muted/20">
                <div className="md:col-span-5 space-y-2">
                  <Label>Institución</Label>
                  <Input {...register(`education.${index}.institution` as const)} />
                </div>
                <div className="md:col-span-4 space-y-2">
                  <Label>Título</Label>
                  <Input {...register(`education.${index}.degree` as const)} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Año Fin</Label>
                  <Input {...register(`education.${index}.endDate` as const)} />
                </div>
                <div className="md:col-span-1 flex items-end pb-1 justify-end">
                  <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeEdu(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </SlideIn>

      <SlideIn delay={0.4}>
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5 text-primary" />
              <CardTitle>Habilidades Técnicas</CardTitle>
            </div>
            <CardDescription>Asegúrate de que las tecnologías clave estén presentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Skills (Separados por coma)</Label>
              <textarea 
                {...register("skills")} 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="React, Node.js, TypeScript, etc."
              />
            </div>
          </CardContent>
        </Card>
      </SlideIn>

      <div className="fixed bottom-0 md:bottom-6 left-0 md:left-64 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border flex justify-end px-4 md:px-8 z-40 pb-safe">
        <Button type="submit" size="lg" disabled={isSaving} className="w-full md:w-auto min-w-[200px]">
          {isSaving ? 'Guardando...' : (
            <>
              <Save className="w-4 h-4 mr-2" /> Guardar Perfil
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
