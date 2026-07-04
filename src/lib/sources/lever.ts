import { fetchWithTimeout } from '../utils/fetchWithTimeout'

export async function fetchLeverJobs(boardToken: string) {
  try {
    const res = await fetchWithTimeout(
      `https://api.lever.co/v0/postings/${boardToken}?mode=json`,
      {},
      8000
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((j: any) => ({
      source: "lever",
      external_id: j.id,
      company: boardToken,
      title: j.text,
      location: j.categories?.location,
      description: j.descriptionPlain,
      apply_url: j.applyUrl,
      raw: j,
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}
