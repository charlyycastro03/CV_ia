import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export async function fetchGreenhouseJobs(boardToken: string) {
  try {
    const res = await fetchWithTimeout(
      `https://api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`,
      {},
      8000
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.jobs.map((j: any) => ({
      source: "greenhouse",
      external_id: String(j.id),
      company: boardToken,
      title: j.title,
      location: j.location?.name,
      description: j.content,
      apply_url: j.absolute_url,
      raw: j,
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}
