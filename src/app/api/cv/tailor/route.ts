import { NextResponse } from "next/server";
import { model } from "@/lib/gemini";
import { supabaseServer } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { jobId } = await req.json();
    const supabase = supabaseServer();

    const { data: job } = await supabase.from("jobs").select("*").eq("id", jobId).single();
    const { data: cv } = await supabase.from("cv_master").select("*").order('updated_at', { ascending: false }).limit(1).single();

    const prompt = `
    Eres un experto en optimización de CVs para sistemas ATS.
    Reglas estrictas:
    - NO inventes experiencia, empresas, fechas ni logros nuevos.
    - Puedes reordenar, priorizar y reescribir con las palabras clave de la vacante, usando SOLO información que ya está en el CV.
    - Devuelve el CV adaptado en el mismo formato JSON de entrada, más una carta de presentación breve (150 palabras).

    Responde SOLO este JSON (sin delimitadores \`\`\`json):
    {"cv_adaptado": {...mismo esquema...}, "carta": "texto"}

    CV ORIGINAL: ${JSON.stringify(cv.structured)}
    VACANTE: ${job.title} en ${job.company}. Descripción: ${job.description}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const { cv_adaptado, carta } = JSON.parse(responseText);

    const { data, error } = await supabase
      .from("matches")
      .update({ tailored_cv: cv_adaptado, cover_letter: carta, status: "tailored" })
      .eq("job_id", jobId)
      .select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
