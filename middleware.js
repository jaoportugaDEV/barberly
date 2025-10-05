import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // 🔹 Sem sessão e tenta acessar dashboard → volta pro login
  if (pathname.startsWith("/dashboard") && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 🔹 Usuário logado tentando acessar login/signup
  if ((pathname === "/login" || pathname === "/signup") && session) {
    // Busca o perfil do usuário logado
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("tipo, id, id_barbearia")
      .eq("id", session.user.id)
      .single();

    if (perfil) {
      if (perfil.tipo === "dono") {
        return NextResponse.redirect(new URL(`/dono/${perfil.id}`, req.url));
      } else if (perfil.tipo === "funcionario") {
        return NextResponse.redirect(
          new URL(`/dashboard/${perfil.id_barbearia}`, req.url)
        );
      }
    }
  }

  return res;
}

export const config = {
  matcher: ["/login", "/signup", "/dashboard/:path*", "/dono/:path*"],
};
