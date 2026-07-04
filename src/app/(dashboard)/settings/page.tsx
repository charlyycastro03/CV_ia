"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Moon, Sun, Monitor, Palette } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground mt-1">
            Personaliza tu experiencia en la plataforma
          </p>
        </div>

        {/* Apariencia */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Palette className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Apariencia</CardTitle>
                <CardDescription>
                  Personaliza el tema y colores de la aplicación
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selector de Tema */}
            <div className="space-y-3">
              <Label>Tema</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Sun className="h-5 w-5" />
                  <span>Claro</span>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Moon className="h-5 w-5" />
                  <span>Oscuro</span>
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => setTheme('system')}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Monitor className="h-5 w-5" />
                  <span>Sistema</span>
                </Button>
              </div>
            </div>

            {/* Vista previa de colores */}
            <div className="space-y-3">
              <Label>Vista previa</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-background border rounded-lg space-y-2">
                  <div className="h-8 bg-primary rounded flex items-center justify-center text-primary-foreground text-sm font-medium">
                    Botón Primario
                  </div>
                  <div className="h-8 bg-secondary rounded flex items-center justify-center text-secondary-foreground text-sm">
                    Botón Secundario
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="text-sm font-medium">Texto Principal</div>
                  <div className="text-xs text-muted-foreground">Texto Secundario</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
            <CardDescription>
              Configura cómo y cuándo recibir notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones por email</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe actualizaciones sobre tus aplicaciones
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Nuevos matches</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar cuando haya empleos compatibles
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Preferencias de Búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Preferencias de Búsqueda</CardTitle>
            <CardDescription>
              Configura los criterios para buscar empleos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ubicación preferida</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remoto</SelectItem>
                  <SelectItem value="hybrid">Híbrido</SelectItem>
                  <SelectItem value="onsite">Presencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de empleo</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fulltime">Tiempo completo</SelectItem>
                  <SelectItem value="parttime">Medio tiempo</SelectItem>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
