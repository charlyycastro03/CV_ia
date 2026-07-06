import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export async function fetchRemoteOKJobs(query: string = '') {
  try {
    // RemoteOK doesn't have a direct query param in this endpoint, but we can fetch the general API and filter
    const url = 'https://remoteok.com/api';
    const res = await fetchWithTimeout(url, {}, 8000);
    
    if (!res.ok) return [];
    
    const data = await res.json();
    
    // RemoteOK API returns an array where the first element is usually metadata or a legal disclaimer.
    // We slice from index 1.
    const jobs = Array.isArray(data) ? data.slice(1) : [];
    
    return jobs.map((j: any) => {
      // remoteOK legal attribution: must link back to remoteok
      const applyUrl = j.url || '';
      
      // We encode the salary explicitly into a text string so our parser can read it natively, 
      // or we can pass it directly.
      const salaryMin = j.salary_min || 0;
      const salaryMax = j.salary_max || 0;
      const salaryText = salaryMin > 0 ? `$${Math.round(salaryMin / 1000)}k - $${Math.round(salaryMax / 1000)}k` : '';

      return {
        source: 'remoteok',
        external_id: String(j.id),
        company: j.company || 'RemoteOK',
        title: j.position || j.title || '',
        location: j.location || 'Worldwide',
        description: j.description || '',
        apply_url: applyUrl,
        salary_text: salaryText,
        raw: j
      }
    });
  } catch (e) {
    console.error('Error fetching RemoteOK:', e);
    return [];
  }
}
