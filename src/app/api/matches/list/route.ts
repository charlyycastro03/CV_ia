import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = supabaseServer();
    // Obtenemos todos los trabajos y hacemos un left join con matches
    // Como un job puede tener múltiples matches si hay múltiples usuarios, 
    // filtramos por usuario (aunque aquí es uso personal).
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select(`
        *,
        matches (
          id,
          score,
          status
        )
      `)
      .order("fetched_at", { ascending: false });

    if (error) throw error;

    // Aplanar los datos para el frontend
    const formattedJobs = jobs.map((job: any) => {
      const match = job.matches && job.matches.length > 0 ? job.matches[0] : null;
      return {
        id: job.id,
        title: job.title,
        company: job.company,
        matchId: match?.id,
        match: match?.score || 0,
        status: match?.status || 'new', // new = sin match calculado, pending = calculado pero no adaptado
      };
    });

    return NextResponse.json(formattedJobs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
