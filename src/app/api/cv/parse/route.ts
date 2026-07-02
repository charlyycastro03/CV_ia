import { NextRequest, NextResponse } from "next/server";
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

    const prompt = `
    Extrae el siguiente CV a un JSON con esta forma exacta, sin inventar
    nada que no esté en el documento:
    {
      "nombre": "", "contacto": {}, "resumen": "",
      "experiencia": [{"puesto":"","empresa":"","periodo":"","logros":[]}],
      "educacion": [{"titulo":"","institucion":"","anio":""}],
      "skills": [], "idiomas": []
    }
    Responde SOLO el JSON, sin texto adicional (ni siquiera \`\`\`json).`;

    let result;
    if (file.type === "application/pdf") {
      // Gemini 1.5 Flash soporta lectura nativa de PDFs!
      result = await model.generateContent([
        {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: "application/pdf"
          }
        },
        prompt
      ]);
    } else {
      const rawText = buffer.toString("utf-8");
      result = await model.generateContent([rawText, prompt]);
    }

    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const structured = JSON.parse(responseText);

    const supabase = supabaseServer();
    
    // Guardamos el JSON como raw_text para futuras referencias (ya no ocupamos el texto plano crudo)
    const { data, error } = await supabase
      .from("cv_master")
      .insert({ 
        user_id: "00000000-0000-0000-0000-000000000000",
        raw_text: JSON.stringify(structured), 
        structured 
      })
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Parse API Error:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
