import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ====================== CRIAR BARBEIRO ======================
export async function POST(req) {
  try {
    const { name, email, password, phone, barbearia_id } = await req.json();

    if (!name || !email || !password || !phone || !barbearia_id) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    let { data: userData, error: signUpError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (signUpError) {
      if (signUpError.message.includes("registered")) {
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers.users.find((u) => u.email === email);
        if (!existing) {
          return NextResponse.json(
            { error: "Usuário já existe, mas não foi encontrado." },
            { status: 400 }
          );
        }
        userData = { user: existing };
      } else {
        return NextResponse.json({ error: signUpError.message }, { status: 400 });
      }
    }

    const userId = userData.user.id;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      name,
      phone,
      role: "barber",
      barbearia_id,
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: userData.user });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ====================== LISTAR BARBEIROS ======================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const barbearia_id = searchParams.get("barbearia_id");

    if (!barbearia_id) {
      return NextResponse.json(
        { error: "barbearia_id é obrigatório" },
        { status: 400 }
      );
    }

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, name, phone, role, barbearia_id")
      .eq("barbearia_id", barbearia_id)
      .eq("role", "barber");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: allUsers } = await supabase.auth.admin.listUsers();
    const barbeirosComEmail = profiles.map((barbeiro) => {
      const authUser = allUsers.users.find((u) => u.id === barbeiro.id);
      return {
        ...barbeiro,
        email: authUser?.email || null,
      };
    });

    return NextResponse.json({ barbeiros: barbeirosComEmail });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ====================== EDITAR BARBEIRO ======================
export async function PUT(req) {
  try {
    const { id, name, phone, barbearia_id } = await req.json();

    if (!id || !name || !phone || !barbearia_id) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({ name, phone, barbearia_id })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ====================== EXCLUIR BARBEIRO ======================
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }

    await supabase.from("profiles").delete().eq("id", id);

    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
