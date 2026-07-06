import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export async function fetchAshbyJobs(boardToken: string) {
  try {
    const res = await fetchWithTimeout(
      `https://api.ashbyhq.com/posting-api/job-board/${boardToken}?includeCompensation=true`,
      {},
      8000
    );
    if (!res.ok) return [];
    
    const data = await res.json();
    
    return (data.jobs || []).map((j: any) => {
      // Ashby might provide structured compensation details.
      const comp = j.compensation || {};
      const salaryMin = comp.compensationTier?.minimum || comp.compensationTier?.amount || 0;
      const salaryMax = comp.compensationTier?.maximum || 0;
      const currency = comp.compensationTier?.currency || 'USD';
      
      const salaryText = salaryMin > 0 ? `${currency} ${Math.round(salaryMin / 1000)}k - ${Math.round(salaryMax / 1000)}k` : '';

      return {
        source: "ashby",
        external_id: String(j.id),
        company: boardToken,
        title: j.title || '',
        location: j.location || 'Remote',
        description: j.descriptionHtml || '',
        apply_url: j.jobUrl || '',
        salary_text: salaryText,
        raw: j,
      }
    });
  } catch (e) {
    console.error(e);
    return [];
  }
}
