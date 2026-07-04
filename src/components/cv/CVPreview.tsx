"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Award } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'

interface CVPreviewProps {
  cvData: any
}

export function CVPreview({ cvData }: CVPreviewProps) {
  if (!cvData) return null

  return (
    <FadeIn>
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                {cvData.name || cvData.personal_info?.name || 'Sin nombre'}
              </CardTitle>
              {(cvData.title || cvData.personal_info?.title) && (
                <p className="text-muted-foreground">{cvData.title || cvData.personal_info.title}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Información de contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(cvData.email || cvData.personal_info?.email) && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <span>{cvData.email || cvData.personal_info.email}</span>
              </div>
            )}
            {(cvData.phone || cvData.personal_info?.phone) && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-primary" />
                <span>{cvData.phone || cvData.personal_info.phone}</span>
              </div>
            )}
            {(cvData.location || cvData.personal_info?.location) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{cvData.location || cvData.personal_info.location}</span>
              </div>
            )}
          </div>

          {/* Resumen/Perfil */}
          {cvData.summary && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Perfil Profesional
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {cvData.summary}
              </p>
            </div>
          )}

          {/* Experiencia */}
          {cvData.experience && cvData.experience.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Experiencia Laboral
              </h3>
              <div className="space-y-4">
                {cvData.experience.map((exp: any, index: number) => (
                  <div key={index} className="border-l-2 border-primary/20 pl-4">
                    <h4 className="font-semibold">{exp.position || exp.title}</h4>
                    <p className="text-sm text-primary font-medium">{exp.company}</p>
                    <p className="text-xs text-muted-foreground">
                      {exp.start_date || exp.startDate} - {exp.end_date || exp.endDate || 'Presente'}
                    </p>
                    {exp.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Educación */}
          {cvData.education && cvData.education.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Educación
              </h3>
              <div className="space-y-3">
                {cvData.education.map((edu: any, index: number) => (
                  <div key={index} className="border-l-2 border-primary/20 pl-4">
                    <h4 className="font-semibold">{edu.degree || edu.title}</h4>
                    <p className="text-sm text-primary font-medium">{edu.institution}</p>
                    <p className="text-xs text-muted-foreground">
                      {edu.start_date || edu.startDate} - {edu.end_date || edu.endDate || 'Presente'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Habilidades */}
          {cvData.skills && cvData.skills.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Habilidades
              </h3>
              <div className="flex flex-wrap gap-2">
                {cvData.skills.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  )
}
