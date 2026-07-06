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

// Function to filter jobs based on target locations for the business
export function filterJobsByLocation(jobs: RemotiveJob[], _userLocation?: string): RemotiveJob[] {
  // We ignore userLocation now and target global/LATAM/US/EU/AU/NZ
  const allowedTerms = [
    'worldwide', 'anywhere', 'global', 'remote', 
    'latam', 'latin america',
    'us', 'usa', 'united states', 'america',
    'uk', 'united kingdom', 'gb',
    'ca', 'canada',
    'au', 'australia',
    'nz', 'new zealand',
    'eu', 'europe', 'de', 'fr', 'at', 'pl',
    'brasil', 'brazil'
  ]
  
  return jobs.filter(job => {
    const reqLoc = (job.candidate_required_location || '').toLowerCase()
    
    // Si no hay restricción, pasa
    if (!reqLoc || reqLoc === '') return true
    
    // Si incluye alguno de los términos permitidos globales o regionales
    if (allowedTerms.some(term => reqLoc.includes(term))) return true
    
    return false
  })
}

// Very basic salary parser looking for $100k+ patterns
export function parseAndValidateSalary(text?: string): { valid: boolean, confirmed: boolean } {
  if (!text) return { valid: true, confirmed: false } // We don't exclude if there is no data
  
  const lowerText = text.toLowerCase()
  
  // Look for patterns like $100k, 120,000, 100.000
  const kPattern = /\$?\s*([0-9]{2,3})\s*k/i
  const thousandPattern = /\$?\s*([0-9]{2,3})[,.][0-9]{3}/i
  
  let detectedAmount = 0
  
  const kMatch = lowerText.match(kPattern)
  if (kMatch && kMatch[1]) {
    detectedAmount = parseInt(kMatch[1], 10) * 1000
  } else {
    const tMatch = lowerText.match(thousandPattern)
    if (tMatch && tMatch[1]) {
      detectedAmount = parseInt(tMatch[1], 10) * 1000
    }
  }

  // If a salary was detected, we enforce the 100k limit. 
  // (We use 90k as a safe lower boundary to not mistakenly exclude close ranges like 95k)
  if (detectedAmount > 0) {
    if (detectedAmount < 90000) {
      return { valid: false, confirmed: true }
    }
    return { valid: true, confirmed: true }
  }

  // If no salary clearly detected, don't exclude
  return { valid: true, confirmed: false }
}
