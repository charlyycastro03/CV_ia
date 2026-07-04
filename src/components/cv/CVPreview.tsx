"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Award, Edit2, Save, X, Plus, Trash2 } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'
import { createClient } from '@/lib/supabase/client'

interface CVPreviewProps {
  cvData: any
  onSave?: (newData: any) => void
  onDelete?: () => void
  readOnly?: boolean
}

export function CVPreview({ cvData, onSave, onDelete, readOnly = false }: CVPreviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>(cvData || {})
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!cvData) return null

  // Ensure formData has all arrays initialized
  const data = formData

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Usuario no autenticado')

      const { error } = await supabase
        .from('profiles')
        .update({ cv_data: formData, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)

      if (error) throw error

      setIsEditing(false)
      if (onSave) onSave(formData)
      alert('CV actualizado correctamente')
    } catch (error: any) {
      console.error(error)
      alert('Error al guardar el CV: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar tu CV actual? Esta acción no se puede deshacer.')) return
    try {
      setIsDeleting(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No auth')

      // Remove cv_data and cv_url from profile
      const { error } = await supabase
        .from('profiles')
        .update({ cv_data: null, cv_url: null, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)

      if (error) throw error

      if (onDelete) onDelete()
      alert('CV eliminado correctamente')
    } catch (error: any) {
      alert('Error al eliminar: ' + error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const updateArrayField = (arrayName: string, index: number, field: string, value: string) => {
    setFormData((prev: any) => {
      const newArray = [...(prev[arrayName] || [])]
      newArray[index] = { ...newArray[index], [field]: value }
      return { ...prev, [arrayName]: newArray }
    })
  }

  const removeArrayItem = (arrayName: string, index: number) => {
    setFormData((prev: any) => {
      const newArray = [...(prev[arrayName] || [])]
      newArray.splice(index, 1)
      return { ...prev, [arrayName]: newArray }
    })
  }

  const addArrayItem = (arrayName: string, template: any) => {
    setFormData((prev: any) => {
      return { ...prev, [arrayName]: [...(prev[arrayName] || []), template] }
    })
  }

  return (
    <FadeIn>
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-2 flex-1 w-full">
              {isEditing ? (
                <>
                  <div className="space-y-1">
                    <Label>Nombre Completo</Label>
                    <Input value={data.name || ''} onChange={(e) => updateField('name', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Título Profesional</Label>
                    <Input value={data.title || ''} onChange={(e) => updateField('title', e.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <User className="w-6 h-6 text-primary" />
                    {data.name || 'Sin nombre'}
                  </CardTitle>
                  {data.title && <p className="text-muted-foreground">{data.title}</p>}
                </>
              )}
            </div>
            
            {!readOnly && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => { setIsEditing(false); setFormData(cvData) }} disabled={isSaving}>
                      <X className="w-4 h-4 mr-2" /> Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      <Save className="w-4 h-4 mr-2" /> Guardar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                      <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" /> Editar
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {/* Información de contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isEditing ? (
              <>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input value={data.email || ''} onChange={(e) => updateField('email', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Teléfono</Label>
                  <Input value={data.phone || ''} onChange={(e) => updateField('phone', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Ubicación</Label>
                  <Input value={data.location || ''} onChange={(e) => updateField('location', e.target.value)} />
                </div>
              </>
            ) : (
              <>
                {data.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-primary" />
                    <span>{data.email}</span>
                  </div>
                )}
                {data.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-primary" />
                    <span>{data.phone}</span>
                  </div>
                )}
                {data.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{data.location}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Resumen/Perfil */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Perfil Profesional
            </h3>
            {isEditing ? (
              <Textarea 
                value={data.summary || ''} 
                onChange={(e) => updateField('summary', e.target.value)}
                rows={4}
              />
            ) : (
              data.summary && <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
            )}
          </div>

          {/* Experiencia */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> Experiencia Laboral
              </h3>
              {isEditing && (
                <Button size="sm" variant="ghost" onClick={() => addArrayItem('experience', { company: '', position: '', startDate: '', endDate: '', description: '' })}>
                  <Plus className="w-4 h-4 mr-1" /> Añadir
                </Button>
              )}
            </div>
            <div className="space-y-6">
              {(data.experience || []).map((exp: any, index: number) => (
                <div key={index} className="border-l-2 border-primary/20 pl-4 relative group">
                  {isEditing ? (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-md">
                      <Button size="icon" variant="destructive" className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeArrayItem('experience', index)}>
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Cargo</Label>
                          <Input value={exp.position || exp.title || ''} onChange={(e) => updateArrayField('experience', index, 'position', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Empresa</Label>
                          <Input value={exp.company || ''} onChange={(e) => updateArrayField('experience', index, 'company', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Fecha Inicio</Label>
                          <Input value={exp.startDate || exp.start_date || ''} onChange={(e) => updateArrayField('experience', index, 'startDate', e.target.value)} placeholder="YYYY-MM" />
                        </div>
                        <div className="space-y-1">
                          <Label>Fecha Fin</Label>
                          <Input value={exp.endDate || exp.end_date || ''} onChange={(e) => updateArrayField('experience', index, 'endDate', e.target.value)} placeholder="YYYY-MM o Presente" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Descripción</Label>
                        <Textarea value={exp.description || ''} onChange={(e) => updateArrayField('experience', index, 'description', e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-semibold">{exp.position || exp.title}</h4>
                      <p className="text-sm text-primary font-medium">{exp.company}</p>
                      <p className="text-xs text-muted-foreground">
                        {exp.start_date || exp.startDate} - {exp.end_date || exp.endDate || 'Presente'}
                      </p>
                      {exp.description && <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Educación */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" /> Educación
              </h3>
              {isEditing && (
                <Button size="sm" variant="ghost" onClick={() => addArrayItem('education', { institution: '', degree: '', startDate: '', endDate: '' })}>
                  <Plus className="w-4 h-4 mr-1" /> Añadir
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {(data.education || []).map((edu: any, index: number) => (
                <div key={index} className="border-l-2 border-primary/20 pl-4 relative group">
                  {isEditing ? (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-md">
                      <Button size="icon" variant="destructive" className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeArrayItem('education', index)}>
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Institución</Label>
                          <Input value={edu.institution || ''} onChange={(e) => updateArrayField('education', index, 'institution', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Título / Grado</Label>
                          <Input value={edu.degree || edu.title || ''} onChange={(e) => updateArrayField('education', index, 'degree', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Fecha Inicio</Label>
                          <Input value={edu.startDate || edu.start_date || ''} onChange={(e) => updateArrayField('education', index, 'startDate', e.target.value)} placeholder="YYYY" />
                        </div>
                        <div className="space-y-1">
                          <Label>Fecha Fin</Label>
                          <Input value={edu.endDate || edu.end_date || ''} onChange={(e) => updateArrayField('education', index, 'endDate', e.target.value)} placeholder="YYYY o Presente" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-semibold">{edu.degree || edu.title}</h4>
                      <p className="text-sm text-primary font-medium">{edu.institution}</p>
                      <p className="text-xs text-muted-foreground">
                        {edu.start_date || edu.startDate} - {edu.end_date || edu.endDate || 'Presente'}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Habilidades */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" /> Habilidades
            </h3>
            {isEditing ? (
              <div className="space-y-2">
                <Label>Habilidades (separadas por comas)</Label>
                <Textarea 
                  value={(data.skills || []).join(', ')} 
                  onChange={(e) => updateField('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean) as any)}
                  placeholder="React, Node.js, TypeScript..."
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(data.skills || []).map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  )
}
