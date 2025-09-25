import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Pega usuário logado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Busca barbearias onde esse user é dono
    const { data, error } = await supabase
      .from("barbearias")
      .select("id, nome")
      .eq("dono_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ barbearias: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
