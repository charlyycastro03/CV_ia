import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import { model } from "@/lib/gemini";
import { supabaseServer } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const rawText =
      file.type === "application/pdf"
        ? (await pdf(buffer)).text
        : buffer.toString("utf-8"); // simplificado

    const prompt = `
    Extrae el siguiente CV a un JSON con esta forma exacta, sin inventar
    nada que no esté en el texto:
    {
      "nombre": "", "contacto": {}, "resumen": "",
      "experiencia": [{"puesto":"","empresa":"","periodo":"","logros":[]}],
      "educacion": [{"titulo":"","institucion":"","anio":""}],
      "skills": [], "idiomas": []
    }
    Texto del CV:
    ---
    ${rawText}
    ---
    Responde SOLO el JSON, sin texto adicional (ni siquiera \`\`\`json).`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const structured = JSON.parse(responseText);

    const supabase = supabaseServer();
    
    // Asumimos un user dummy para uso personal o deberías usar auth.uid()
    // En este caso, no estamos logueados por UI, así que insertaremos sin RLS (usando service role)
    // Opcionalmente podemos usar un ID fijo para tu usuario.
    const { data, error } = await supabase
      .from("cv_master")
      .insert({ raw_text: rawText, structured })
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
