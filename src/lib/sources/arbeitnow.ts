import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export async function fetchArbeitnowJobs() {
  try {
    const url = 'https://www.arbeitnow.com/api/job-board-api?visa_sponsorship=true';
    const res = await fetchWithTimeout(url, {}, 8000);
    
    if (!res.ok) return [];
    
    const data = await res.json();
    
    return data.data.map((j: any) => {
      return {
        source: 'arbeitnow',
        external_id: String(j.slug || j.id || Math.random().toString(36).substr(2, 9)),
        company: j.company_name || '',
        title: j.title || '',
        location: j.location || 'Europe / Worldwide',
        description: j.description || '',
        apply_url: j.url || '',
        raw: j
      }
    });
  } catch (e) {
    console.error('Error fetching Arbeitnow:', e);
    return [];
  }
}
