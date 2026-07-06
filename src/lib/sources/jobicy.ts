import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export async function fetchJobicyJobs() {
  try {
    const url = 'https://jobicy.com/api/v2/remote-jobs?count=20'; 
    const res = await fetchWithTimeout(url, {}, 8000);
    
    if (!res.ok) return [];
    
    const data = await res.json();
    
    return (data.jobs || []).map((j: any) => {
      
      const salaryMin = j.annualSalaryMin || 0;
      const salaryMax = j.annualSalaryMax || 0;
      const salaryText = salaryMin > 0 ? `$${Math.round(salaryMin / 1000)}k - $${Math.round(salaryMax / 1000)}k` : '';

      return {
        source: 'jobicy',
        external_id: String(j.id || Math.random().toString(36).substr(2, 9)),
        company: j.companyName || '',
        title: j.jobTitle || '',
        location: j.jobGeo || 'Worldwide',
        description: j.jobDescription || j.jobExcerpt || '',
        apply_url: j.url || '',
        salary_text: salaryText,
        raw: j
      }
    });
  } catch (e) {
    console.error('Error fetching Jobicy:', e);
    return [];
  }
}
