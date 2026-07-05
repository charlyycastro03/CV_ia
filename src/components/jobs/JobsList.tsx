"use client"

import { useState } from 'react'
import { JobCard } from './JobCard'
import { Briefcase } from 'lucide-react'

interface JobsListProps {
  initialApplications: any[]
}

export function JobsList({ initialApplications }: JobsListProps) {
  const [filter, setFilter] = useState<string>('all')

  const filteredApps = initialApplications.filter(app => {
    if (filter === 'all') return true
    
    const loc = (app.jobs?.location || '').toLowerCase()
    const isRemote = app.jobs?.is_remote
    
    if (filter === 'home_office') {
      return isRemote || loc.includes('remote') || loc.includes('home office')
    }
    if (filter === 'hibrido') {
      return loc.includes('hybrid') || loc.includes('híbrido') || loc.includes('hibrido')
    }
    if (filter === 'presencial') {
      // Si no es remoto y no es híbrido, asumimos presencial
      return !isRemote && !loc.includes('remote') && !loc.includes('hybrid') && !loc.includes('híbrido')
    }
    
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 overflow-x-auto">
        <span className="text-sm font-medium text-muted-foreground mr-2">Filtros:</span>
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
        >
          Todos
        </button>
        <button 
          onClick={() => setFilter('home_office')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'home_office' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
        >
          Home Office
        </button>
        <button 
          onClick={() => setFilter('hibrido')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'hibrido' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
        >
          Híbrido
        </button>
        <button 
          onClick={() => setFilter('presencial')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'presencial' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
        >
          Presencial
        </button>
      </div>

      {filteredApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-muted/20">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No hay empleos que coincidan</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Intenta cambiar los filtros o busca nuevas ofertas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredApps.map((app, index) => (
            <JobCard 
              key={app.id} 
              application={app} 
              delay={index * 0.1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
