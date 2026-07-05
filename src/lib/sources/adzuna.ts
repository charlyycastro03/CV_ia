import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export async function fetchAdzunaJobs(query: string, country = "us") {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return []; // Si no hay credenciales, ignorar Adzuna

  try {
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1` +
      `?app_id=${appId}` +
      `&app_key=${appKey}` +
      `&what=${encodeURIComponent(query)}&results_per_page=50&max_days_old=7`;
    const res = await fetchWithTimeout(url, {}, 8000);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results.map((j: any) => ({
      source: "adzuna",
      external_id: String(j.id),
      company: j.company?.display_name,
      title: j.title,
      location: j.location?.display_name,
      description: j.description,
      apply_url: j.redirect_url,
      raw: j,
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}
