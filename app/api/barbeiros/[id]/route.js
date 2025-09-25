import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔹 Atualizar barbeiro
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const { name, phone, email, password } = await req.json();

    // 1. Atualizar Auth (email/senha)
    if (email || password) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        ...(email ? { email } : {}),
        ...(password ? { password } : {}),
      });
      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    }

    // 2. Atualizar tabela profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ name, phone, ...(email ? { email } : {}) })
      .eq("id", id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🔹 Deletar barbeiro
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // 1. Deletar do Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Deletar do profiles
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", id);
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
