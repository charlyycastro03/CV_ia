import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export interface RemotiveJob {
  id: number
  url: string
  title: string
  company_name: string
  company_logo: string
  category: string
  job_type: string
  publication_date: string
  candidate_required_location: string
  salary: string
  description: string
}

export async function fetchRemoteJobs(limit: number = 20, searchQuery?: string): Promise<RemotiveJob[]> {
  try {
    let url = 'https://remotive.com/api/remote-jobs?limit=' + limit
    if (searchQuery) {
      url += '&search=' + encodeURIComponent(searchQuery)
    } else {
      url += '&category=software-dev'
    }
    const response = await fetchWithTimeout(url, {}, 8000)
    
    if (!response.ok) {
      throw new Error(`Remotive API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.jobs || []
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return []
  }
}

// Function to filter jobs based on location (worldwide, latam, user specific)
export function filterJobsByLocation(jobs: RemotiveJob[], userLocation: string): RemotiveJob[] {
  // A simple heuristic: if it's worldwide, anywhere, or matches the user's country/region
  const allowedTerms = ['worldwide', 'anywhere', 'global', 'remote', 'latam', 'latin america']
  const userLocLower = userLocation.toLowerCase()
  
  return jobs.filter(job => {
    const reqLoc = job.candidate_required_location.toLowerCase()
    
    // Si no hay restricción, pasa
    if (!reqLoc || reqLoc === '') return true
    
    // Si está en los términos globales, pasa
    if (allowedTerms.some(term => reqLoc.includes(term))) return true
    
    // Si incluye la locación del usuario (ej. 'Mexico', 'Argentina', 'Colombia'), pasa
    if (userLocLower && reqLoc.includes(userLocLower)) return true
    
    // De lo contrario, se filtra (restringido a otra zona, ej. 'USA Only', 'UK Only')
    return false
  })
}
