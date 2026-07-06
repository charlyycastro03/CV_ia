import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export async function fetchReedJobs(query: string = '') {
  const apiKey = process.env.REED_API_KEY;
  if (!apiKey) return []; // Ignore if no auth configured

  try {
    const url = `https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(query)}&minimumSalary=95000`;
    
    // HTTP Basic Auth requires base64 encoded username:password (password is empty for Reed)
    const encodedKey = Buffer.from(`${apiKey}:`).toString('base64');
    
    const res = await fetchWithTimeout(url, {
      headers: {
        'Authorization': `Basic ${encodedKey}`
      }
    }, 8000);
    
    if (!res.ok) return [];
    
    const data = await res.json();
    
    return (data.results || []).map((j: any) => {
      const salaryMin = j.minimumSalary || 0;
      const salaryMax = j.maximumSalary || 0;
      const salaryText = salaryMin > 0 ? `£${Math.round(salaryMin / 1000)}k - £${Math.round(salaryMax / 1000)}k` : '';

      return {
        source: 'reed',
        external_id: String(j.jobId || Math.random().toString(36).substr(2, 9)),
        company: j.employerName || '',
        title: j.jobTitle || '',
        location: j.locationName || 'UK',
        description: j.jobDescription || '',
        apply_url: j.jobUrl || '',
        salary_text: salaryText,
        raw: j
      }
    });
  } catch (e) {
    console.error('Error fetching Reed:', e);
    return [];
  }
}
