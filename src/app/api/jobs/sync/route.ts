import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { fetchGreenhouseJobs } from "@/lib/sources/greenhouse";
import { fetchLeverJobs } from "@/lib/sources/lever";
import { fetchAdzunaJobs } from "@/lib/sources/adzuna";
import { supabaseServer } from "@/lib/supabase";

const GREENHOUSE_COMPANIES = ["stripe", "notion", "figma"]; // Ajustar después
const LEVER_COMPANIES = ["netflix"];                        // Ajustar después
const SEARCH_TERMS = ["backend developer", "software engineer"];

export async function GET() {
  const supabase = supabaseServer();
  const all: any[] = [];

  for (const c of GREENHOUSE_COMPANIES) all.push(...await fetchGreenhouseJobs(c));
  for (const c of LEVER_COMPANIES) all.push(...await fetchLeverJobs(c));
  for (const q of SEARCH_TERMS) all.push(...await fetchAdzunaJobs(q));

  // Upsert
  const { error } = await supabase
    .from("jobs")
    .upsert(all, { onConflict: "source,external_id" });

  return NextResponse.json({ inserted: all.length, error: error?.message });
}
