export async function fetchLeverJobs(siteName: string) {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${siteName}?mode=json`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((j: any) => ({
      source: "lever",
      external_id: j.id,
      company: siteName,
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
