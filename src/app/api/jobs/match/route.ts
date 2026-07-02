import { NextResponse } from "next/server";
import { model } from "@/lib/gemini";
import { supabaseServer } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { jobId } = await req.json();
    const supabase = supabaseServer();

    const { data: job, error: jobError } = await supabase.from("jobs").select("*").eq("id", jobId).single();
    if (jobError) throw jobError;

    // Asumimos el CV más reciente
    const { data: cv, error: cvError } = await supabase.from("cv_master").select("*").order('updated_at', { ascending: false }).limit(1).single();
    if (cvError) throw cvError;

    const prompt = `
    Compara este CV (JSON) contra esta descripción de vacante.
    Devuelve SOLO este JSON (sin formato de bloque \`\`\`json):
    {"score": 85, "missing_keywords": ["react", "aws"], "razon": "2 líneas"}

    CV: ${JSON.stringify(cv.structured)}
    VACANTE: ${job.description}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(responseText);

    const { data, error } = await supabase
      .from("matches")
      .upsert({ 
        job_id: jobId, 
        user_id: cv.user_id, // mantén la relación con tu CV
        score: analysis.score,
        missing_keywords: analysis.missing_keywords 
      })
      .select().single();

    if (error) throw error;
    return NextResponse.json({ ...data, razon: analysis.razon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
