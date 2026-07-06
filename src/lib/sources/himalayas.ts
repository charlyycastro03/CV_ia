import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export async function fetchHimalayasJobs(query: string = '') {
  try {
    const url = 'https://himalayas.app/jobs/api?limit=20'; // Max limit according to API
    const res = await fetchWithTimeout(url, {}, 8000);
    
    if (!res.ok) return [];
    
    const data = await res.json();
    
    return (data.jobs || []).map((j: any) => {
      return {
        source: 'himalayas',
        external_id: String(j.id || Math.random().toString(36).substr(2, 9)),
        company: j.companyName || j.company_name || 'Himalayas Job',
        title: j.title || '',
        location: j.locationRestrictions?.join(', ') || 'Worldwide',
        description: j.description || j.excerpt || '',
        apply_url: j.applicationLink || j.url || '',
        raw: j
      }
    });
  } catch (e) {
    console.error('Error fetching Himalayas:', e);
    return [];
  }
}
