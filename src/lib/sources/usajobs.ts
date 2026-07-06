import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export async function fetchUSAJobs(query: string = '') {
  const apiKey = process.env.USAJOBS_API_KEY;
  const email = process.env.USAJOBS_EMAIL;
  
  if (!apiKey || !email) return []; // Ignore if no auth configured

  try {
    const url = `https://data.usajobs.gov/api/Search?Keyword=${encodeURIComponent(query)}&MinimumSalary=120000`; 
    const res = await fetchWithTimeout(url, {
      headers: {
        'Authorization-Key': apiKey,
        'User-Agent': email
      }
    }, 8000);
    
    if (!res.ok) return [];
    
    const data = await res.json();
    
    return (data.SearchResult?.SearchResultItems || []).map((j: any) => {
      const job = j.MatchedObjectDescriptor;
      const salaryMin = job.PositionRemuneration?.[0]?.MinimumRange || 0;
      const salaryMax = job.PositionRemuneration?.[0]?.MaximumRange || 0;
      const salaryText = salaryMin > 0 ? `$${Math.round(salaryMin / 1000)}k - $${Math.round(salaryMax / 1000)}k` : '';

      return {
        source: 'usajobs',
        external_id: String(job.PositionID || Math.random().toString(36).substr(2, 9)),
        company: `${job.DepartmentName || ''} (Gobierno Federal EE.UU.)`,
        title: job.PositionTitle || '',
        location: job.PositionLocationDisplay || 'USA',
        description: job.UserArea?.Details?.JobSummary || '',
        apply_url: job.PositionURI || '',
        salary_text: salaryText,
        raw: job
      }
    });
  } catch (e) {
    console.error('Error fetching USAJobs:', e);
    return [];
  }
}
