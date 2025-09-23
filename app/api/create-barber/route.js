// app/api/create-barber/route.js
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

/**
 * POST /api/create-barber
 * body: { barbeariaId, name, phone, email, password }
 */
export async function POST(req) {
  try {
    const { barbeariaId, name, phone, email, password } = await req.json();

    if (!barbeariaId || !name || !email || !password) {
      return NextResponse.json(
        { error: "Informe barbeariaId, name, email e password." },
        { status: 400 }
      );
    }

    // 1) Cria o usuário no Auth (email/senha)
    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // já confirma o e-mail
        user_metadata: { nome: name, phone },
      });

    if (createErr) {
      return NextResponse.json(
        { error: `Auth: ${createErr.message}` },
        { status: 400 }
      );
    }

    const userId = created.user.id;

    // 2) Upsert no profile (vincula à barbearia)
    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          name,
          phone,
          role: "barber",
          barbearia_id: barbeariaId,
        },
        { onConflict: "id" }
      );

    if (profErr) {
      return NextResponse.json(
        { error: `profiles: ${profErr.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, userId }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erro interno ao criar barbeiro." },
      { status: 500 }
    );
  }
}
