// app/api/create-barber/route.js
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabaseServer";

/**
 * POST /api/create-barber
 * body: { name, phone, email, password, barbeariaId }
 */
export async function POST(req) {
  try {
    const { name, phone, email, password, barbeariaId } = await req.json();

    if (!name || !email || !password || !barbeariaId) {
      return NextResponse.json(
        { error: "Informe nome, email, senha e barbeariaId." },
        { status: 400 }
      );
    }

    // pega o dono logado
    const supabase = createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Erro ao autenticar dono." },
        { status: 401 }
      );
    }

    // verifica se essa barbearia realmente pertence ao dono
    const { data: barbearia, error: barbErr } = await supabaseAdmin
      .from("barbearias")
      .select("id")
      .eq("id", barbeariaId)
      .eq("dono_id", user.id)
      .single();

    if (barbErr || !barbearia) {
      return NextResponse.json(
        { error: "Essa barbearia não pertence ao dono." },
        { status: 403 }
      );
    }

    // cria o usuário no Auth do Supabase
    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome: name, phone },
      });

    if (createErr) {
      return NextResponse.json(
        { error: `Auth: ${createErr.message}` },
        { status: 400 }
      );
    }

    const userId = created.user.id;

    // cria o profile vinculado à barbearia escolhida
    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          name,
          phone,
          role: "barber",
          barbearia_id: barbeariaId, // 🔑 agora vem do front
        },
        { onConflict: "id" }
      );

    if (profErr) {
      return NextResponse.json(
        { error: `profiles: ${profErr.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: true, userId, barbeariaId },
      { status: 201 }
    );
  } catch (e) {
    console.error("Erro interno:", e);
    return NextResponse.json(
      { error: "Erro interno ao criar barbeiro." },
      { status: 500 }
    );
  }
}
