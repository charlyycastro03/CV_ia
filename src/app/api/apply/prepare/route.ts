import { NextResponse } from "next/server";
import { Resend } from "resend";
// import { renderCvToPdf } from "@/lib/pdf"; // Opcional, requiere setup de @react-pdf/renderer
import { supabaseServer } from "@/lib/supabase";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const { matchId, sendByEmail, recruiterEmail } = await req.json();
    const supabase = supabaseServer();

    const { data: match, error } = await supabase
      .from("matches")
      .select("*, jobs(*)")
      .eq("id", matchId)
      .single();

    if (error) throw error;

    // Aquí generaríamos el PDF del CV adaptado:
    // const pdfBuffer = await renderCvToPdf(match.tailored_cv);

    if (sendByEmail && recruiterEmail && resend) {
      await resend.emails.send({
        from: "tu_correo_verificado@tudominio.com",
        to: recruiterEmail,
        subject: `Aplicación: ${match.jobs.title}`,
        text: match.cover_letter,
        // attachments: [{ filename: "CV_Carlos_Castro.pdf", content: pdfBuffer }],
      });
    }

    await supabase.from("matches").update({ status: "sent" }).eq("id", matchId);
    
    return NextResponse.json({ ok: true, message: "Prepared/Sent successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
