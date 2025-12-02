import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // 🔹 Rotas públicas que não precisam de autenticação
  const publicRoutes = ["/login", "/cadastro", "/trial", "/assinatura"];
  
  // 🔹 Sem sessão e tenta acessar rota protegida → volta pro login
  if (!session && !publicRoutes.includes(pathname)) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/dono") || pathname === "/signup") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // 🔹 Com sessão, verifica assinatura para rotas de dono
  if (session && pathname.startsWith("/dono")) {
    // Busca o perfil
    const { data: perfil } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    // Apenas donos podem acessar /dono
    if (perfil?.role === "owner") {
      // Verifica assinatura/trial
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, trial_end")
        .eq("user_id", session.user.id)
        .single();

      // Sem subscription/trial, redireciona para trial
      if (!subscription) {
        return NextResponse.redirect(new URL("/trial", req.url));
      }

      // Verifica se trial expirou
      if (subscription.status === "trial" && subscription.trial_end) {
        const trialEnd = new Date(subscription.trial_end);
        if (trialEnd < new Date()) {
          // Trial expirado, redireciona para assinatura
          return NextResponse.redirect(new URL("/assinatura", req.url));
        }
      }

      // Verifica se assinatura está ativa
      if (subscription.status !== "active" && subscription.status !== "trial") {
        return NextResponse.redirect(new URL("/assinatura", req.url));
      }
    } else if (perfil?.role === "barber") {
      // Barbeiro tentando acessar área de dono
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // 🔹 Usuário logado tentando acessar login
  if (pathname === "/login" && session) {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("role, barbearia_id")
      .eq("id", session.user.id)
      .single();

    if (perfil) {
      if (perfil.role === "owner") {
        return NextResponse.redirect(new URL("/dono/[donoid]", req.url));
      } else if (perfil.role === "barber" && perfil.barbearia_id) {
        return NextResponse.redirect(
          new URL(`/dashboard/${perfil.barbearia_id}`, req.url)
        );
      }
    }
  }

  // 🔹 Sem sessão e tenta acessar dashboard → volta pro login
  if (pathname.startsWith("/dashboard") && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/login",
    "/cadastro",
    "/signup",
    "/trial",
    "/assinatura",
    "/dashboard/:path*",
    "/dono/:path*"
  ],
};
